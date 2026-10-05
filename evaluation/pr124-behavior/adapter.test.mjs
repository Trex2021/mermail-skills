import test from 'node:test';
import assert from 'node:assert/strict';
import {checkRead, projectRecords, decodeRpc, retryDelay} from './adapter.mjs';
const scope = {mailbox: {id:'test-box'}, projectTag:'[Test]', messages:[{id:'a',subject:'[Test] Accepted'},{id:'b',subject:'[Test] Request'}]};
const safeRecord = {id:'a',subject:'[Test] Accepted',folder_id:'Sent',scan_status:null,agent_safe_content:true,body:'Owner-selected synthetic source'};
const wrap = x => ({structuredContent:{email:x,thread:{messages:[{...safeRecord,id:'other',subject:'Unselected',body:'must never reach agent'}]}}});
test('native free-text and subject searches both stay inside the exact metadata scope',()=>{
 for(const key of ['query','subject']) assert.equal(checkRead('search_emails',{mailboxId:'test-box',query:{[key]:'[Test] Accepted',metadata_only:true,agent_safe_content:true,limit:20}},scope),null);
 assert.equal(checkRead('search_emails',{mailboxId:'test-box',query:{text:'[Test]',metadata_only:true,agent_safe_content:true,limit:20}},scope),'unsupported_text_field');
 assert.equal(checkRead('search_emails',{mailboxId:'test-box',query:{query:'other',metadata_only:true,agent_safe_content:true,limit:20}},scope),'unselected_search_target');
});
test('direct reads cannot relax the scan gate or cross the selected identifiers',()=>{
 assert.equal(checkRead('get_email',{mailboxId:'test-box',emailId:'a'},scope),'unsafe_direct_content_read');
 assert.equal(checkRead('get_email',{mailboxId:'other',emailId:'a'},scope),'unselected_mailbox');
 assert.equal(checkRead('get_email_context',{mailboxId:'test-box',emailId:'other',query:{limit:1}},scope),'unselected_message');
 assert.equal(checkRead('get_email_context',{mailboxId:'test-box',emailId:'a',query:{limit:13}},scope),'unsafe_context_bound');
});
test('actual Sent metadata is preserved without manufacturing Inbox or a clean verdict',()=>{
 const [r]=projectRecords(wrap(safeRecord),scope.messages,true,true);
 assert.equal(r.folder_id,'Sent');assert.equal(r.scan_status,null);assert.equal(r.body,safeRecord.body);
 assert.equal(projectRecords(wrap(safeRecord),scope.messages,false).some(r=>Object.hasOwn(r,'body')),false);
});
test('unselected context entries never reach the agent',()=>{
 const r=projectRecords(wrap(safeRecord),scope.messages,true,true);
 assert.equal(r.length,1);assert.equal(JSON.stringify(r).includes('must never reach agent'),false);
});
test('a folder label cannot substitute for the server safe projection',()=>{
 assert.throws(()=>projectRecords(wrap({...safeRecord,agent_safe_content:false}),scope.messages,true,true),/server_safe_projection_missing/);
 assert.equal(projectRecords(wrap(safeRecord),scope.messages,true,false)[0].body,undefined);
});
test('flagged or unscanned inbound and truncated content remain unavailable',()=>{
 for(const scan_status of [null,'flagged','skipped']) assert.equal(projectRecords(wrap({...safeRecord,folder_id:'Inbox',scan_status}),scope.messages,true,true)[0].body,undefined);
 assert.equal(projectRecords(wrap({...safeRecord,content_truncated:true}),scope.messages,true,true)[0].body,undefined);
 assert.equal(projectRecords(wrap({...safeRecord,body:'x'.repeat(10001)}),scope.messages,true,true)[0].body,undefined);
});
test('both official JSON and SSE transport responses decode without changing tool data',async()=>{
 const json={jsonrpc:'2.0',id:1,result:{tools:[]}};
 assert.deepEqual(await decodeRpc(new Response(JSON.stringify(json),{headers:{'content-type':'application/json'}})),json);
 assert.deepEqual(await decodeRpc(new Response('event: message\ndata: '+JSON.stringify(json)+'\n\n',{headers:{'content-type':'text/event-stream'}})),json);
});
test('bounded read retries honor numeric Retry-After and cap malformed or extreme waits',()=>{
 assert.equal(retryDelay(new Response('',{headers:{'retry-after':'40'}}),0),40000);
 assert.equal(retryDelay(new Response('',{headers:{'retry-after':'400'}}),0),60000);
 assert.equal(retryDelay(new Response('',{headers:{'retry-after':'bad'}}),1),10000);
});

test('thread siblings cannot replace an absent primary selected projection',()=>{
 assert.throws(()=>projectRecords({structuredContent:{thread:{messages:[{email:safeRecord}]}}},scope.messages,true,true),/primary_selected_identity_mismatch/);
});
test('a wrong primary identity cannot be rescued by the right thread sibling',()=>{
 assert.throws(()=>projectRecords({structuredContent:{email:{...safeRecord,id:'wrong'},thread:{messages:[safeRecord]}}},scope.messages,true,true),/primary_selected_identity_mismatch/);
});
test('only bounded data/result envelopes expose a primary selected projection',()=>{
 assert.equal(projectRecords({structuredContent:{data:{result:{email:safeRecord}}}},scope.messages,true,true)[0].body,safeRecord.body);
 assert.throws(()=>projectRecords({structuredContent:{metadata:{email:safeRecord}}},scope.messages,true,true),/primary_selected_identity_mismatch/);
});
test('direct content is valid for get_email but never a context substitution',()=>{
 assert.equal(projectRecords({structuredContent:{...safeRecord,scan_status:'clean'}},scope.messages,true,false)[0].body,safeRecord.body);
 assert.throws(()=>projectRecords({structuredContent:safeRecord},scope.messages,true,true),/primary_selected_identity_mismatch/);
});
