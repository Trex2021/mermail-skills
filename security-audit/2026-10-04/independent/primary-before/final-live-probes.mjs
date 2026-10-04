import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const base = new URL('.',import.meta.url).pathname;
const results = [];
const cases = [
  { mode: 'inbox', shouldPass: true },
  { mode: 'sent', shouldPass: true },
  { mode: 'sent_named', shouldPass: true },
  { mode: 'sent_incoming', shouldPass: false, error: 'selected-message-security' },
  { mode: 'sent_omitted', shouldPass: false, error: 'selected-message-security' },
  { mode: 'changed_baseline', shouldPass: false },
  { mode: 'sent_unavailable', shouldPass: false, error: 'selected-sent-context-unavailable' },
  { mode: 'sent_nested_primary', shouldPass: false, error: 'selected-message-identity' },
];
for (const test of cases) {
  let observed;
  try {
    const { mode, shouldPass } = test;
    const callsPath = base+'final-live-calls-'+mode+'.json';
    const output = spawnSync(process.execPath,['--import',base+'final-live-mock.mjs',new URL('../source/skills/mermail-freelance-margin-guard/scripts/run-live-proof.mjs',import.meta.url).pathname,'--seed-and-prove'],{
      encoding:'utf8',timeout:10000,env:{MERMAIL_API_KEY:'synthetic-offline-only',MERMAIL_LIVE_RESUME:'1',MERMAIL_LIVE_RUN_TAG:'final-independent',MERMAIL_LIVE_MAILBOX_ID:'synthetic-mailbox',SYNTHETIC_LIVE_MODE:mode,SYNTHETIC_LIVE_CALL_LOG:callsPath},
    });
    assert.ifError(output.error);
    const calls=JSON.parse(readFileSync(callsPath,'utf8'));
    const selectedReads=calls.filter(c=>['get_email','get_email_context'].includes(c.params?.name)).map(c=>c.params);
    observed={exitCode:output.status,reportedPassed:output.stdout.includes('Live Mermail Margin Guard proof passed'),stdout:output.stdout,stderr:output.stderr,selectedReads,mockOnly:true};
    assert(!calls.some(c=>/send|reply|draft|wallet|paybox/.test(c.params?.name||'')), 'no external write operations');
    assert.equal(observed.exitCode,shouldPass?0:1,observed.stderr);
    assert.equal(observed.reportedPassed,shouldPass);
    if (test.error) assert(observed.stderr.includes(test.error),observed.stderr);
    if (mode === 'sent_unavailable') assert.equal(selectedReads.length,0,'unadvertised safe context must fail before reads');
    else {
      assert(selectedReads.every(read=>read.name === (mode.startsWith('sent') ? 'get_email_context' : 'get_email')),'selected reads use the matching safe content path only');
      for (const read of selectedReads) {
        assert(['synthetic-baseline','synthetic-request'].includes(read.arguments.emailId),'exact selected identity');
        if (read.name === 'get_email_context') assert.equal(read.arguments.query?.limit,1,'safe context requests explicitly bound thread messages to one');
        else assert.deepEqual(read.arguments.query,{require_scan_status:'clean',agent_safe_content:true,max_body_chars:10000});
      }
    }
    results.push({mode,pass:true,shouldPass,observed});
  } catch (error) {
    results.push({mode:test.mode,pass:false,shouldPass:test.shouldPass,error:error.message,observed});
  }
}
const report={passes:results.filter(result=>result.pass).length,failures:results.filter(result=>!result.pass).length,results};
writeFileSync(base+'final-live-results.json',JSON.stringify(report,null,2)+'\n');
for (const result of results) process.stdout.write((result.pass?'PASS ':'FAIL ')+result.mode+(result.error?': '+result.error:'')+'\n');
process.exitCode=report.failures?1:0;
