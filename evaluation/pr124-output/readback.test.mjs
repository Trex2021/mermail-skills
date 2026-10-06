import test from 'node:test';
import assert from 'node:assert/strict';
import {sha} from './output.mjs';
import {verifyExisting,publicProjection} from './readback.mjs';
const owner='owner@example.invalid';
function ready(){
 const packet={integrity:{packetDigest:'a'.repeat(64)},marginSnapshot:{},baseline:{revisionBudget:{}},clientOptions:[]};
 const p={mailbox:{id:'selected-mailbox',email:owner},packet,messages:[],correspondence:{verifiedEmailSources:2},reportMarkdown:'Report selected-mailbox'};
 p.preview={from:owner,to:[owner],cc:[],bcc:[],subject:'Synthetic scope choices',body:'Hypothetical fee only.',arguments:{body:{draft_id:'selected-draft',from:owner,to:owner,cc:[],bcc:[],subject:'Synthetic scope choices',body:'Hypothetical fee only.',attachments:[]}}};
 p.previewDigest=sha(p.preview);
 return {p,approval:{approvedPreviewDigest:p.previewDigest,expectedPacketDigest:packet.integrity.packetDigest,historicalSaveRun:'37214396573'}};
}
const actual=()=>({id:'selected-draft',subject:'Synthetic scope choices',body:'Hypothetical fee only.',sender:owner,recipient:owner,folder_name:'Drafts',agent_safe_content:true,attachments:[]});
test('current-product compatibility uses only one read of the exact existing approved draft',async()=>{
 const {p,approval}=ready(),calls=[];
 const result=await verifyExisting(p,approval,async(method,args)=>{calls.push({method,args});return{structuredContent:actual()};});
 assert.equal(result.readbackVerified,true);assert.equal(result.sent,false);
 assert.equal(calls.length,1);assert.equal(calls[0].args.name,'get_email');assert.equal(calls[0].args.arguments.emailId,'selected-draft');
});
test('changed source packet or exact preview stops before any network request',async()=>{
 for(const change of [x=>x.p.preview.body+=' changed',x=>x.approval.expectedPacketDigest='b'.repeat(64),x=>x.approval.approvedPreviewDigest='b'.repeat(64)]){
  const x=ready();change(x);let calls=0;
  await assert.rejects(verifyExisting(x.p,x.approval,async()=>{calls++;}));assert.equal(calls,0);
 }
});
test('a matching nested sibling cannot replace a mismatching primary draft',async()=>{
 const {p,approval}=ready();
 await assert.rejects(verifyExisting(p,approval,async()=>({structuredContent:{email:{...actual(),id:'unselected'},thread:[actual()]}})));
});
test('changed body, copies, sender, state, scan projection or attachments fail closed',async()=>{
 for(const edit of [{body:'Unapproved fee'},{bcc:['leak@example.invalid']},{sender:'other@example.invalid'},{folder_name:'Sent'},{agent_safe_content:false},{content_truncated:true},{attachments:[{filename:'unapproved.txt'}]}]){
  const {p,approval}=ready();await assert.rejects(verifyExisting(p,approval,async()=>({structuredContent:{...actual(),...edit}})));
 }
});
test('public projection redacts identifiers and refuses unexpected writes',()=>{
 const {p,approval}=ready(),outcome={draftId:'selected-draft',bodySha256:sha(p.preview.body),readbackVerified:true};
 const result=publicProjection(p,outcome,[],approval);assert(!result.markdown.includes('selected-mailbox'));
 assert.equal(result.status.saveAttempts,0);assert.equal(result.status.externalSends,0);
 assert.throws(()=>publicProjection(p,outcome,[{writeAttempt:true}],approval),/unexpected_write_attempt/);
 p.preview.body='Please contact '+owner;assert.throws(()=>publicProjection(p,outcome,[],approval),/public_body_contains_address/);
});
