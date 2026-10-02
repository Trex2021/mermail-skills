import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyReplyPreview} from './preview.mjs';
const context={mailbox:{email:'owner@example.test'},request:{id:'selected-request',subject:'[Test] Change',metadata:{recipient:'owner@example.test'}},packet:{marginSnapshot:{completeTotalFeeRange:{min:387.75,max:568.7}},integrity:{packetDigest:'d'.repeat(64)}}};
const headers='**From:** owner@example.test\n**To:** owner@example.test\n**Cc/Bcc:** None\n**Subject:** Re: [Test] Change\n**Source message / thread:** `selected-request`\n';
const body='Thank you for the request. We can propose the paid change order at $387.75–$568.70 USD and target October 15, 2026. Added work still needs written approval.';
const digest='\n### State and integrity\n**Packet digest:** `'+context.packet.integrity.packetDigest+'`';
test('complete blockquoted text needs no cosmetic Body label',()=>{
 assert.equal(verifyReplyPreview(headers+'\n> '+body+digest,context).valid,true);
});
test('an explicit Body heading and ordinary header format also work',()=>{
 assert.equal(verifyReplyPreview(headers.replace(/\*\*/g,'')+'\nBody: '+body+digest,context).valid,true);
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
 assert.ok(verifyReplyPreview(headers+'\n> '+body.replace('568.70','600.00')+digest,context).failures.includes('preview_price_mismatch'));
 assert.ok(verifyReplyPreview(headers+'\n> '+body.replace('October 15, 2026','a later date')+digest,context).failures.includes('preview_deadline_missing'));
});
