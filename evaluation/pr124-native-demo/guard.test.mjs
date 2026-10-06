import test from 'node:test';
import assert from 'node:assert/strict';
import {freezePreview,requireSaveAuthority,verifyReadback,SUBJECT,hash} from './guard.mjs';

const scope={mailbox:{id:'selected-box',email:'owner@example.invalid'}};
const packet={state:'scope_change_detected',integrity:{packetDigest:'a'.repeat(64)},clientOptions:[{},{},{}],marginSnapshot:{knownAddedHours:{min:15,max:22},completeBaseFeeRange:{min:352.5,max:517},completeTotalFeeRange:{min:387.75,max:568.7}}};
const body='SYNTHETIC demonstration with hypothetical owner estimates. The client requested a dashboard, Stripe, login and two revision rounds. The remaining included revision is not charged again. Additions total 15-22 hours at 23.50 USD/hour. Ordinary added fees: 352.50-517.00 USD. A 10% rush rule gives 387.75-568.70 USD. Remove or swap and keep 2026-10-20. Extend to 2026-10-24 or 2026-10-25. Review paid rush for 2026-10-15. No option has been accepted and no additional work is authorized. Exclusions and original responsive desktop, tablet and mobile acceptance criteria remain. Confirm calendar availability before a written agreement. This is only an unsent draft, not a delivered message, payment or real customer revenue.';
const args=()=>({mailboxId:'selected-box',body:{from:'owner@example.invalid',to:'owner@example.invalid',cc:[],bcc:[],subject:SUBJECT,body,body_format:'text',attachments:[]}});
const freeze=a=>freezePreview(a,packet.integrity.packetDigest,scope,packet);
const gate=f=>({action:'save_draft_only',authorizationSource:'owner_delegated_demo_operator',previewDigest:f.previewDigest,packetDigest:packet.integrity.packetDigest});
test('an unchanged bounded self-test preview is hashed and can be separately approved',()=>{const f=freeze(args());assert.equal(hash(f.preview),f.previewDigest);requireSaveAuthority(f.preview.arguments,f,gate(f),[],packet);});
for(const [name,mutate] of [
 ['different mailbox',a=>a.mailboxId='other'],
 ['external recipient',a=>a.body.to='client@example.invalid'],
 ['hidden copy',a=>a.body.bcc=['leak@example.invalid']],
 ['attachment',a=>a.body.attachments=['private-file']],
 ['unexpected threading',a=>a.body.reply_to='stranger@example.invalid'],
 ['HTML mode',a=>a.body.body_format='html'],
 ['private identity in body',a=>a.body.body+=' Contact owner@example.invalid'],
 ['bidi body',a=>a.body.body+='\u202e'],
 ['invented price',a=>a.body.body=a.body.body.replace('387.75','1.00')],
 ['missing hypothetical limit',a=>a.body.body=a.body.body.replace('hypothetical','actual')],
]) test('reject '+name,()=>{const a=args();mutate(a);assert.throws(()=>freeze(a));});
test('absent, stale and mutated approvals cannot grant save authority',()=>{const f=freeze(args());assert.throws(()=>requireSaveAuthority(f.preview.arguments,f,null,[],packet));assert.throws(()=>requireSaveAuthority(f.preview.arguments,f,{...gate(f),previewDigest:'b'.repeat(64)},[],packet));const changed=structuredClone(f.preview.arguments);changed.body.body+=' Changed after approval.';assert.throws(()=>requireSaveAuthority(changed,f,gate(f),[],packet));});
test('a prior attempted write prohibits any retry, including ambiguous outcomes',()=>{const f=freeze(args());assert.throws(()=>requireSaveAuthority(f.preview.arguments,f,gate(f),[{kind:'save_attempt',success:false}],packet));});
const observed=(f)=>({id:'new-draft',subject:SUBJECT,folder_name:'Drafts',agent_safe_content:true,body:f.preview.arguments.body.body,sender:'owner@example.invalid',recipient:'owner@example.invalid',cc:[],bcc:[],attachments:[]});
test('readback must contain the whole unchanged unsent body and exact recipients',()=>{const f=freeze(args());assert.equal(verifyReadback(observed(f),'new-draft',f).bodyHash,hash(body));for(const mutate of [e=>e.body=e.body.slice(0,-1),e=>e.folder_name='Sent',e=>e.bcc=['hidden@example.invalid'],e=>e.recipient='client@example.invalid',e=>e.content_truncated=true,e=>e.agent_safe_content=false,e=>e.id='other']){const e=observed(f);mutate(e);assert.throws(()=>verifyReadback(e,'new-draft',f));}});
