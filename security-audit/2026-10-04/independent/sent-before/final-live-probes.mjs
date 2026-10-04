import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const base = new URL('.',import.meta.url).pathname;
const results = [];
for (const mode of ['inbox','sent']) {
  const callsPath = base+'final-live-calls-'+mode+'.json';
  const output = spawnSync(process.execPath,['--import',base+'final-live-mock.mjs',new URL('../source/skills/mermail-freelance-margin-guard/scripts/run-live-proof.mjs',import.meta.url).pathname,'--seed-and-prove'],{
    encoding:'utf8',timeout:10000,env:{MERMAIL_API_KEY:'synthetic-offline-only',MERMAIL_LIVE_RESUME:'1',MERMAIL_LIVE_RUN_TAG:'final-independent',MERMAIL_LIVE_MAILBOX_ID:'synthetic-mailbox',SYNTHETIC_LIVE_MODE:mode,SYNTHETIC_LIVE_CALL_LOG:callsPath},
  });
  assert.ifError(output.error);
  const calls=JSON.parse(readFileSync(callsPath,'utf8'));
  assert(!calls.some(c=>/send|reply|draft|wallet|paybox/.test(c.params?.name||'')));
  results.push({mode,exitCode:output.status,reportedPassed:output.stdout.includes('Live Mermail Margin Guard proof passed'),stdout:output.stdout,stderr:output.stderr,selectedReads:calls.filter(c=>['get_email','get_email_context'].includes(c.params?.name)).map(c=>c.params),mockOnly:true});
}
assert.equal(results[0].exitCode,0,results[0].stderr);
assert.equal(results[0].reportedPassed,true);
writeFileSync(base+'final-live-results.json',JSON.stringify(results,null,2)+'\n');
process.stdout.write(JSON.stringify(results,null,2)+'\n');
process.exitCode=results[1].exitCode===0?0:1;
