import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolveSelectedEmailEvidence, LIVE_BASELINE_BODY } from '../source/skills/mermail-freelance-margin-guard/scripts/run-live-proof.mjs';
globalThis.fetch = async () => { throw new Error('Independent primary selection is network disabled'); };
const selected = { id: 'selected-synthetic', body: LIVE_BASELINE_BODY, date: '2026-08-10T12:00:00Z', scan_status: 'clean', agent_safe_content: true, folder_id: 'Inbox', is_incoming: true, content_omitted: false, content_truncated: false };
const wrong = { ...selected, id: 'unselected-synthetic' };
const cases = [
  { name: 'get_email supports direct selected projection', payload: selected, tool: 'get_email', allow: true },
  { name: 'get_email_context requires a primary email envelope', payload: selected, tool: 'get_email_context', allow: false },
  { name: 'mismatched primary cannot be repaired by matching thread sibling', payload: {email: wrong,thread:{messages:[selected]}}, tool:'get_email_context', allow: false },
  { name: 'unselected sibling does not contaminate the correct primary', payload: {email: selected,thread:{messages:[wrong]}}, tool:'get_email_context', allow: true },
  { name: 'omitted primary cannot be repaired by safe matching thread sibling', payload: {email: {...selected,content_omitted:true,body:''},thread:{messages:[selected]}}, tool:'get_email_context', allow:false },
  { name: 'absent primary cannot be replaced by plain matching thread sibling', payload: {thread:{messages:[selected]}}, tool:'get_email_context', allow:false },
  { name: 'absent primary cannot be replaced by nested email in thread sibling', payload: {thread:{messages:[{email:selected}]}}, tool:'get_email_context', allow:false },
];
const results=[];
for (const test of cases) {
  let receipt, thrown;
  try { receipt=resolveSelectedEmailEvidence([test.payload],selected.id,[],test.tool); }
  catch(error) { thrown=error.message; }
  try {
    assert.equal(Boolean(receipt),test.allow,'required selected primary envelope behavior');
    results.push({name:test.name,pass:true,expectedAllow:test.allow,observedAllow:Boolean(receipt),error:thrown??null,payload:test.payload});
  } catch(error) {
    results.push({name:test.name,pass:false,expectedAllow:test.allow,observedAllow:Boolean(receipt),error:error.message,payload:test.payload,observedReceipt:receipt});
  }
}
const report={passes:results.filter(r=>r.pass).length,failures:results.filter(r=>!r.pass).length,results,mockOnly:true};
writeFileSync(new URL('./final-primary-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
for(const result of results) process.stdout.write((result.pass?'PASS ':'FAIL ')+result.name+(result.pass?'':': '+result.error)+'\n');
process.exitCode=report.failures?1:0;
