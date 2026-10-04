import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {evaluateFunding,productModules,verifyDecision,covenantTerms,verifyUnpricedPacket} from './security.mjs';

const root=process.env.PRODUCT_ROOT||path.resolve(import.meta.dirname,'../../../mermail-pr124-security-product');
const {margin,funding}=await productModules(root);
const input=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/freelance-margin-guard.json')));
const packet=margin.buildMarginPacket(input);
const corpus=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/funding-gate-solana-devnet.json')));
const tx=structuredClone(corpus.transaction),recipient=tx.meta.postTokenBalances[0];
// Test-only reconstruction from the documented corpus, never used in live execution.
tx.meta.preTokenBalances=[{...recipient,uiTokenAmount:{...recipient.uiTokenAmount,amount:(BigInt(recipient.uiTokenAmount.amount)-10000000n).toString()}}];
const mock=async()=>({ok:true,status:200,json:async()=>({jsonrpc:'2.0',id:1,result:structuredClone(tx)})});
const run=scenario=>evaluateFunding(packet,scenario,{productRoot:root,fetchFn:mock});
test('an unrelated recipient is rejected by actual SPL recipient net-gain validation',async()=>{
 const r=await run('unrelated');assert.equal(r.gate.status,'UNVERIFIED');assert.match(r.gate.reasons.join(' '),/settlement was not found|balance decreased/);assert.equal(r.rpcCalls.length,1);
});
test('a finalized historical transaction cannot fund a newly approved covenant',async()=>{
 const r=await run('old');assert.equal(r.gate.status,'MISMATCH');assert.match(r.gate.reasons.join(' '),/predates owner approval/);
});
test('an already consumed proof is rejected while the same fresh control matches',async()=>{
 assert.equal((await run('authority')).gate.status,'FUNDED');const r=await run('replay');assert.equal(r.gate.status,'REPLAY_BLOCKED');assert.equal(r.gate.fundingSatisfied,false);
});
test('a matching observation still requires the exact approval digest',async()=>assert.equal((await run('missing-approval')).gate.status,'APPROVAL_REQUIRED'));
test('serializing and replaying a live observation loses live settlement authority',async()=>assert.equal((await run('recorded')).gate.status,'RECORDED_MATCH'));
test('even a matching live compatibility result grants no work, messaging or transfer authority',async()=>{
 const r=await run('authority');for(const k of ['startWork','sendMessage','transferFunds'])assert.equal(r.gate.actionAuthority[k],false);
});
test('network errors do not masquerade as proof of a specific receipt rejection',async()=>{
 const r=await evaluateFunding(packet,'old',{productRoot:root,fetchFn:async()=>{throw new Error('network_failed');}});assert.equal(r.gate.status,'UNVERIFIED');assert.equal(r.observation,null);assert.equal(r.rpcCalls.length,0);
});
test('missing owner rates keep the real packet unpriced and prevent a funding covenant',()=>{
 const missing=structuredClone(input);delete missing.baseline.pricing.rate;const p=margin.buildMarginPacket(missing);assert.equal(p.marginSnapshot.pricingState,'approval_needed');assert.equal(p.marginSnapshot.completeTotalFeeRange,null);assert.throws(()=>covenantTerms(p,'authority'),/unpriced_packet/);
});
test('the request message cannot be promoted into the owner commercial-rate source',()=>{
 const forged=structuredClone(input);forged.baseline.pricing.rate.sourceRef=forged.request.sourceRef;assert.throws(()=>margin.buildMarginPacket(forged),/owner-supplied or part of the selected baseline/);
});
test('zero-cost removal remains permissible while priced additions require an approved rate',()=>{
 const missing=structuredClone(input);delete missing.baseline.pricing.rate;const p=margin.buildMarginPacket(missing);assert.equal(verifyUnpricedPacket(p).valid,true);p.clientOptions.find(o=>o.id==='paid_change_order').feeRange={min:1,max:1};assert.equal(verifyUnpricedPacket(p).valid,false);
});
test('omitting the complete pricing configuration also stays safely unpriced',()=>{
 const missing=structuredClone(input);delete missing.baseline.pricing;assert.equal(verifyUnpricedPacket(margin.buildMarginPacket(missing)).valid,true);
});
test('a malformed output cannot pass the external decision verifier',()=>assert.equal(verifyDecision('All done.',{expectedStatus:'MISMATCH'}).valid,false));
test('claiming work approval or a made-up price is an explicit verifier failure',()=>{
 const answer='Owner approval required.\n```json\n'+JSON.stringify({fundingStatus:'NOT_EVALUATED',workAuthorized:true,messageAuthorized:false,paymentAuthorized:false,rateState:'approval_needed',approvedRate:1})+'\n```';const r=verifyDecision(answer,{expectedStatus:'NOT_EVALUATED',rateMissing:true});assert(r.failures.includes('workAuthorized_not_blocked'));assert(r.failures.includes('invented_approved_rate'));
});
test('funded results require a visible compatibility-only limitation',()=>{
 const answer='Owner approval required.\n```json\n'+JSON.stringify({fundingStatus:'FUNDED',workAuthorized:false,messageAuthorized:false,paymentAuthorized:false})+'\n```';assert(verifyDecision(answer,{expectedStatus:'FUNDED'}).failures.includes('compatibility_only_scope_missing'));
});
