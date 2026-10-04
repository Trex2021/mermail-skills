import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const source = new URL('../source/', import.meta.url).pathname;
const base = new URL('.', import.meta.url).pathname;
const coverage = JSON.parse(readFileSync(source + 'tool-coverage.json', 'utf8'));
const catalog = [coverage.confirmationTool, ...Object.values(coverage.domains).flat()];
const syntheticKey = ['sk','proj','independent','offline','synthetic','only'].join('-');
const results = [];
function check(name, task) {
  try { results.push({ name, pass: true, detail: task() ?? null }); }
  catch (error) { results.push({ name, pass: false, error: error.message }); }
}
const mockPath = base + 'after-credential-mock.mjs';
writeFileSync(mockPath, `
import { writeFileSync } from 'node:fs';
const catalog = ${JSON.stringify(catalog)};
const coverage = ${JSON.stringify(coverage)};
const calls = [];
globalThis.fetch = async (url, request = {}) => {
  const mode = process.env.SYNTHETIC_MOCK_MODE;
  const key = process.env.MERMAIL_API_KEY || process.env.MERMAIL_MCP_TEST_API_KEY;
  calls.push({url: String(url), redirect: request.redirect, hasSignal: request.signal instanceof AbortSignal});
  if (String(url) === coverage.discoveryEndpoint) return Response.json({capabilities: {tools: {list: catalog}}});
  if (String(url) !== coverage.mcpEndpoint && String(url) !== coverage.mcpEndpoint + '?profile=agent-inbox') throw new Error('Unexpected mock URL');
  if (!request.headers?.['x-api-key']) return new Response(null, {status:401});
  const rpc = JSON.parse(request.body);
  if (mode === 'throw-key') throw new Error('synthetic network exception reflects ' + key);
  if (mode === 'invalid-json-key') return {ok:true,status:200,json:async()=>{throw new Error('synthetic JSON exception reflects ' + key)}};
  if (mode === 'error-key') return Response.json({jsonrpc:'2.0',id:rpc.id,error:{code:-32000,message:key}});
  let result;
  if (rpc.method === 'initialize') result = {serverInfo: {name: mode === 'name-key' ? key : 'synthetic'}};
  else if (rpc.method === 'tools/list') {
    const names = [...catalog];
    if (mode === 'catalog-key') names[names.length - 1] = key;
    result = {tools: names.map(name=>({name}))};
  } else if (rpc.method === 'tools/call' && ['list_workspaces','list_mailboxes'].includes(rpc.params.name)) result = {structuredContent:{items:[]}};
  else throw new Error('Unexpected mock operation');
  return Response.json({jsonrpc: mode === 'wrong-envelope' ? '0.0' : '2.0', id: mode === 'wrong-envelope' ? 999 : rpc.id, result});
};
process.on('exit',()=>writeFileSync(process.env.SYNTHETIC_CALL_LOG,JSON.stringify(calls,null,2)+'\\n'));
`);
function run(mode, remote = false, endpoint) {
  const log = base + 'after-credential-calls-' + mode + (remote ? '-remote' : '') + '.json';
  const result = spawnSync(process.execPath, ['--import', mockPath, remote ? source + 'tests/validate.mjs' : source + 'skills/mermail-mcp/scripts/check-connection.mjs', ...(remote ? ['--remote'] : [])], {
    cwd: source, encoding: 'utf8', timeout: 10000,
    env: { MERMAIL_API_KEY: syntheticKey, MERMAIL_MCP_TEST_API_KEY: syntheticKey, MERMAIL_REQUIRE_TEST_API_KEY: '1', SYNTHETIC_MOCK_MODE: mode, SYNTHETIC_CALL_LOG: log, ...(endpoint ? {MERMAIL_MCP_URL:endpoint} : {}) },
  });
  assert.ifError(result.error);
  const calls = JSON.parse(readFileSync(log, 'utf8'));
  return { ...result, calls };
}
for (const mode of ['error-key','throw-key','invalid-json-key','name-key','catalog-key']) check('connection checker redacts ' + mode, () => {
  const result = run(mode);
  assert(!result.stderr.includes(syntheticKey)); assert(!result.stdout.includes(syntheticKey));
  assert(result.calls.every(c=>c.redirect==='error'&&c.hasSignal));
  return {exitCode:result.status, stdout:result.stdout, stderr:result.stderr};
});
for (const endpoint of ['http://console.mermail.app/mcp','https://evil.example.test/mcp','https://console.mermail.app/mcp?profile=bad','https://console.mermail.app/mcp?profile=agent-inbox&profile=agent-inbox']) check('connection checker rejects before credential transport: ' + endpoint, () => {
  const result = run('error-key', false, endpoint);
  assert.equal(result.status,1); assert.equal(result.calls.length,0);
});
check('connection checker rejects wrong JSON-RPC envelope', () => {
  const result = run('wrong-envelope'); assert.equal(result.status,1); assert(!result.stdout.includes('Connected'));
});
check('CI remote validator redacts key reflected in authenticated catalog', () => {
  const result = run('catalog-key', true);
  assert.equal(result.status,1);
  const reflected = result.stderr.includes(syntheticKey);
  writeFileSync(base+'after-ci-catalog-key-result.json',JSON.stringify({exitCode:result.status,syntheticKeyInStderr:reflected,stderr:result.stderr.replaceAll(syntheticKey,'[SYNTHETIC_KEY]'),mockOnly:true},null,2)+'\n');
  assert(!reflected, 'authenticated catalog diff emitted the synthetic credential');
});
check('CI remote validator rejects wrong JSON-RPC envelope', () => {
  const result = run('wrong-envelope', true);
  const reportedPassed = result.stdout.includes('Authenticated Mermail proof passed');
  writeFileSync(base+'after-ci-envelope-result.json',JSON.stringify({exitCode:result.status,reportedPassed,stdout:result.stdout,stderr:result.stderr,mockOnly:true},null,2)+'\n');
  assert.equal(result.status,1,'validator accepted JSON-RPC version 0.0 and unrelated response id 999');
  assert(!reportedPassed);
});
writeFileSync(base+'after-transport-results.json',JSON.stringify({passes:results.filter(r=>r.pass).length,failures:results.filter(r=>!r.pass).length,results},null,2)+'\n');
for (const result of results) process.stdout.write((result.pass?'PASS ':'FAIL ')+result.name+(result.error?': '+result.error:'')+'\n');
process.exitCode=results.some(r=>!r.pass)?1:0;
