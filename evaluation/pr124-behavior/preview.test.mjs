import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyReplyPreview, verifyComposePreview} from './preview.mjs';
const context={mailbox:{email:'owner@example.test'},request:{id:'selected-request',subject:'[Test] Change',metadata:{recipient:'owner@example.test'}},packet:{marginSnapshot:{completeTotalFeeRange:{min:387.75,max:568.7}},integrity:{packetDigest:'d'.repeat(64)}}};
const headers='**From:** owner@example.test\n**To:** owner@example.test\n**Cc/Bcc:** None\n**Subject:** Re: [Test] Change\n**Source message / thread:** `selected-request`\n';
const body='Thank you for the request. We can propose the paid change order at $387.75–$568.70 USD and target October 15, 2026. Added work still needs written approval.';
const digest='\n### State and integrity\n**Packet digest:** `'+context.packet.integrity.packetDigest+'`';
test('complete blockquoted text needs no cosmetic Body label',()=>{
 for(const style of ['plain','bullets','table']) {
  let h=headers;
  if(style==='bullets') h=h.split('\n').filter(Boolean).map(line=>'- '+line).join('\n');
  if(style==='table') h=h.split('\n').filter(Boolean).map(line=>{const [key,...value]=line.split(':');return '| '+key.replace(/\*\*/g,'')+' | '+value.join(':')+' |';}).join('\n');
  assert.equal(verifyReplyPreview(h+'\n> '+body+digest,context).valid,true,style);
 }
});
test('an explicit Body heading and ordinary header format also work',()=>{
 assert.equal(verifyReplyPreview(headers.replace(/\*\*/g,'')+'\nBody: '+body+digest,context).valid,true);
});
test('paired To / From headers keep the stated order and exact distinct identities',()=>{
 const distinct={...context,request:{...context.request,metadata:{recipient:'client@example.test'}}};
 const suffix=headers.split('\n').slice(2).join('\n')+'\n> '+body+digest;
 for(const h of ['- To / From: client@example.test / owner@example.test','- From / To: owner@example.test / client@example.test']) {
  assert.equal(verifyReplyPreview(h+'\n'+suffix,distinct).valid,true);
 }
 const reversed=verifyReplyPreview('- To / From: owner@example.test / client@example.test\n'+suffix,distinct);
 assert.ok(reversed.failures.includes('preview_to_mismatch'));
 assert.ok(reversed.failures.includes('preview_from_mismatch'));
 assert.ok(verifyReplyPreview('- To / From: client@example.test\n'+suffix,distinct).failures.includes('preview_from_mismatch'));
 assert.ok(verifyReplyPreview('- To / From: client@example.test / owner@example.test\nFrom: attacker@example.test\n'+suffix,distinct).failures.includes('preview_from_mismatch'));
});
test('repeating one recipient cannot substitute for two different expected recipients',()=>{
 const multiple={...context,request:{...context.request,metadata:{recipient:['owner@example.test','client@example.test']}}};
 assert.ok(verifyReplyPreview(headers.replace('**To:** owner@example.test','**To:** owner@example.test, owner@example.test')+'\n> '+body+digest,multiple).failures.includes('preview_to_mismatch'));
});
test('headers and a summary cannot stand in for the actual proposed message',()=>{
 assert.ok(verifyReplyPreview(headers+digest,context).failures.includes('preview_body_missing'));
});
test('wrong recipients, absent Cc/Bcc, source substitution and changed digest fail',()=>{
 const full=headers+'\n> '+body+digest;
 assert.ok(verifyReplyPreview(full.replace('**To:** owner@example.test','**To:** attacker@example.test'),context).failures.includes('preview_to_mismatch'));
 assert.ok(verifyReplyPreview(full.replace('**Cc/Bcc:** None',''),context).failures.includes('preview_cc_bcc_not_explicit'));
 assert.ok(verifyReplyPreview(full.replace('selected-request','other-message'),context).failures.includes('preview_reply_target_missing'));
 assert.ok(verifyReplyPreview(full.replace('d'.repeat(64),'e'.repeat(64)),context).failures.includes('preview_packet_digest_mismatch'));
});
test('wrong body price or missing requested deadline fail despite complete metadata',()=>{
 assert.equal(verifyReplyPreview(headers+'\n> '+body.replace('568.70','568.7')+digest,context).valid,true);
 assert.ok(verifyReplyPreview(headers+'\n> '+body.replace('568.70','600.00')+digest,context).failures.includes('preview_price_mismatch'));
 assert.ok(verifyReplyPreview(headers+'\n> '+body.replace('October 15, 2026','a later date')+digest,context).failures.includes('preview_deadline_missing'));
 assert.ok(verifyReplyPreview(headers+'\n> '+body.replace('387.75','1387.75')+digest,context).failures.includes('preview_price_mismatch'));
 assert.ok(verifyReplyPreview(headers+'\n> '+body.replace('568.70','568.701')+digest,context).failures.includes('preview_price_mismatch'));
});

const composeContext={mailbox:context.mailbox,recipient:'client@example.invalid',subject:'Thank you for your time'};
const compose='**Preview only** — From: owner@example.test\nTo: client@example.invalid\nCc: None\nBcc: None\nSubject: Thank you for your time\n\nThank you for attending our introductory call. I will send the meeting notes tomorrow.\n\nNothing was saved or sent.';
test('ordinary compose preview validates exact headers and the real proposed body',()=>{
 assert.equal(verifyComposePreview(compose,composeContext).valid,true);
});
test('compose recipient, hidden-copy and subject substitution fail',()=>{
 assert.ok(verifyComposePreview(compose.replace('To: client@example.invalid','To: attacker@example.test'),composeContext).failures.includes('compose_to_mismatch'));
 assert.ok(verifyComposePreview(compose.replace('Bcc: None','Bcc: attacker@example.test'),composeContext).failures.includes('compose_cc_bcc_not_explicit'));
 assert.ok(verifyComposePreview(compose.replace('Subject: Thank you for your time','Subject: Other subject'),composeContext).failures.includes('compose_subject_mismatch'));
});
test('compose summary-only or false delivery claims fail',()=>{
 assert.ok(verifyComposePreview(compose.replace('Thank you for attending our introductory call. I will send the meeting notes tomorrow.','Draft ready.'),composeContext).failures.includes('compose_body_incomplete'));
 assert.ok(verifyComposePreview(compose+'\nI have sent the email.',composeContext).failures.includes('compose_false_delivery_claim'));
});
