import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha,encryptReview,saveApproved,makeRpc,makePacket,makePreview,TAG} from './output.mjs';
const value={mailbox:{id:'selected-box',email:'owner@example.invalid'},preview:{action:'save_draft_only',from:'owner@example.invalid',to:['owner@example.invalid'],cc:[],bcc:[],subject:'Test',body:'Owner-approved hypothetical draft',packetDigest:'a'.repeat(64),arguments:{mailboxId:'selected-box',body:{from:'owner@example.invalid',to:'owner@example.invalid',cc:[],bcc:[],subject:'Test',body:'Owner-approved hypothetical draft',body_format:'text',attachments:[]},idempotencyKey:'test-identical-payload-only'}}};
const ready=()=>{const p=structuredClone(value);p.previewDigest=sha(p.preview);return p;};
test('missing exact approval makes no write even for an owner self-test draft',async()=>{
 let calls=0;await assert.rejects(saveApproved(ready(),'',async()=>{calls++;}));assert.equal(calls,0);
});
test('recipient, text and hidden-copy edits invalidate previously approved preview',async()=>{
 for(const edit of [p=>p.preview.arguments.body.to='other@example.invalid',p=>p.preview.body+=' Changed fee',p=>p.preview.bcc=['leak@example.invalid']]){
  const p=ready();const approved=p.previewDigest;edit(p);let calls=0;await assert.rejects(saveApproved(p,approved,async()=>{calls++;}));assert.equal(calls,0);
 }
});
test('allowed save happens once and verifies the exact unsent self-addressed readback',async()=>{
 const p=ready(),calls=[];
 const remote=async(method,args)=>{calls.push(args.name);return {structuredContent:args.name==='save_draft'?{draft_id:'draft-1'}:{id:'draft-1',subject:'Test',body:p.preview.body,sender:p.preview.from,recipient:p.preview.from,folder_name:'Drafts',agent_safe_content:true,scan_status:null}};};
 const result=await saveApproved(p,p.previewDigest,remote);assert.deepEqual(calls,['save_draft','get_email']);assert.equal(result.sent,false);assert.equal(result.readbackVerified,true);
});
test('uncertain write outcome is never retried and does not claim a saved draft',async()=>{
 const p=ready();let calls=0;await assert.rejects(saveApproved(p,p.previewDigest,async()=>{calls++;throw new Error('timeout');}));assert.equal(calls,1);
});
test('different saved text, recipient or non-draft state cannot pass readback',async()=>{
 for(const replacement of [{body:'Fee altered'},{recipient:'other@example.invalid'},{folder_name:'Sent'},{sender:'other@example.invalid'},{attachments:[{filename:'unapproved.txt'}]}]){
  const p=ready();let writes=0;
  const remote=async(_,{name})=>{if(name==='save_draft'){writes++;return{structuredContent:{draft_id:'draft-1'}};}return{structuredContent:{id:'draft-1',subject:'Test',body:p.preview.body,sender:p.preview.from,recipient:p.preview.from,folder_name:'Drafts',agent_safe_content:true,...replacement}};};
  await assert.rejects(saveApproved(p,p.previewDigest,remote));assert.equal(writes,1);
 }
});
test('transport rejects send, wallet and draft calls during preparation before networking',async()=>{
 const remote=makeRpc('not-a-real-key','prepare',[]);
 for(const name of ['save_draft','send_email','reply_to_email','paybox_request_transfer'])await assert.rejects(remote('tools/call',{name,arguments:{}}));
 const write=makeRpc('not-a-real-key','save',[]);await assert.rejects(write('tools/call',{name:'send_email',arguments:{}}));
});
test('private preview is encrypted for the reviewer, not written into the public envelope',()=>{
 const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
 const pub=publicKey.export({format:'der',type:'spki'}).toString('base64');const data={privateRecipient:'owner@example.invalid',draft:'Exact text'};
 const encrypted=encryptReview(data,pub);assert(!JSON.stringify(encrypted).includes(data.privateRecipient));
 const key=crypto.privateDecrypt({key:privateKey,oaepHash:'sha256',padding:crypto.constants.RSA_PKCS1_OAEP_PADDING},Buffer.from(encrypted.encryptedKey,'base64'));
 const decipher=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(encrypted.nonce,'base64'));decipher.setAuthTag(Buffer.from(encrypted.tag,'base64'));
 const plain=Buffer.concat([decipher.update(Buffer.from(encrypted.ciphertext,'base64')),decipher.final()]);assert.deepEqual(JSON.parse(plain),data);
});
test('pinned product verifies both selected sources and prices only the overflow revision',{skip:!process.env.PRODUCT_ROOT},async()=>{
 const helper=await import(pathToFileURL(path.join(process.env.PRODUCT_ROOT,'skills/mermail-freelance-margin-guard/scripts/run-live-proof.mjs')).href);
 const builder=await import(pathToFileURL(path.join(process.env.PRODUCT_ROOT,'skills/mermail-freelance-margin-guard/scripts/build-margin-packet.mjs')).href);
 const mailbox={id:'test-box',email:'owner@example.invalid'};
 const messages=[['baseline','Accepted scope',helper.LIVE_BASELINE_BODY],['request','Change request',helper.LIVE_REQUEST_BODY]].map(([slot,suffix,body],i)=>({slot,id:'test-source-'+i,subject:'['+TAG+'] '+suffix,email:{id:'test-source-'+i,subject:'['+TAG+'] '+suffix,date:'2026-09-09T10:00:00.000Z',sender:mailbox.email,recipient:mailbox.email,body,agent_safe_content:true,scan_status:null,folder_id:'Sent'}}));
 const prepared=makePacket(helper,builder,mailbox,messages);
 assert.equal(prepared.correspondence.verifiedEmailSources,2);
 assert.deepEqual(prepared.packet.marginSnapshot.knownAddedHours,{min:15,max:22});
 assert.deepEqual(prepared.packet.marginSnapshot.completeTotalFeeRange,{min:387.75,max:568.7});
 assert.equal(prepared.packet.baseline.revisionBudget.covered,1);assert.equal(prepared.packet.baseline.revisionBudget.overflow,1);
 const {preview}=makePreview(mailbox,messages,prepared.packet);
 assert(preview.body.includes('2026-10-24-2026-10-25'));assert(preview.body.includes('387.75-568.70 USD'));
 const foreign=structuredClone(messages);foreign[1].email.recipient='other@example.invalid';
 assert.throws(()=>makePacket(helper,builder,mailbox,foreign),/source_is_not_selected_self_test/);
});
