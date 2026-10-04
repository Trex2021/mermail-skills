import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { buildMarginPacket, verifyMarginPacket } from '../source/skills/mermail-freelance-margin-guard/scripts/build-margin-packet.mjs';
import { buildFundingCovenant, observePublicSettlement, verifyFundingGate, verifyPublicFundingReceiptLive } from '../source/skills/mermail-freelance-margin-guard/scripts/funding-gate.mjs';
import { resolveSelectedEmailEvidence, LIVE_BASELINE_BODY } from '../source/skills/mermail-freelance-margin-guard/scripts/run-live-proof.mjs';

globalThis.fetch = async () => { throw new Error('Network disabled for independent validation'); };
const clone = value => JSON.parse(JSON.stringify(value));
const results = [];
async function check(name, task) {
  try { const detail = await task(); results.push({ name, pass: true, detail: detail ?? null }); }
  catch (error) { results.push({ name, pass: false, error: error.message }); }
}
const fixture = JSON.parse(await readFile(new URL('../source/tests/fixtures/freelance-margin-guard.json', import.meta.url), 'utf8'));
const packet = buildMarginPacket(clone(fixture));
const owner = '9xQeWvG816bUx9EPfEZ4C3FJmK7x5hHkzYdZ8xF5HnG';
const signature = '3'.repeat(88);
const baseTerms = {
  optionId: 'paid_change_order', price: { amount: '487.5', currency: 'USD' },
  settlement: { chain: 'base', assetSymbol: 'ETH', assetId: 'native', decimals: 18, amount: '0.01', destination: '0x1111111111111111111111111111111111111111' },
  conversion: { mode: 'owner_fixed', sourceRef: 'synthetic-owner-conversion' },
  binding: { mode: 'public_transaction' }, ownerApprovalRef: 'synthetic-approval', ownerApprovedAt: '2026-09-22T10:00:00Z',
  policy: { minimumConfirmations: 2, validUntil: '2026-10-01T00:00:00Z' },
};
const evmCovenant = buildFundingCovenant(packet, baseTerms);
const evmHash = '0x' + 'ab'.repeat(32);
const blockHash = '0x' + 'cd'.repeat(32);
const replacementHash = '0x' + 'ef'.repeat(32);
const evmRpc = {
  eth_chainId: '0x2105',
  eth_getTransactionByHash: { hash: evmHash, blockHash, blockNumber: '0x64', from: '0x2222222222222222222222222222222222222222', to: baseTerms.settlement.destination, value: '0x2386f26fc10000', input: '0x' },
  eth_getTransactionReceipt: { transactionHash: evmHash, blockHash, blockNumber: '0x64', status: '0x1', to: baseTerms.settlement.destination, logs: [] },
  eth_blockNumber: '0x69',
  eth_getBlockByNumber: { hash: blockHash, number: '0x64', transactions: [evmHash], timestamp: '0x' + (1790092800).toString(16) },
};
function mockRpc(results, calls = []) {
  return async (_url, request) => {
    const { method, id, params } = JSON.parse(request.body);
    calls.push({ method, params });
    assert.equal(request.redirect, 'error');
    assert(request.signal instanceof AbortSignal);
    assert(Object.hasOwn(results, method), 'Unexpected RPC operation ' + method);
    return { ok: true, status: 200, json: async () => ({ jsonrpc: '2.0', id, result: clone(results[method]) }) };
  };
}
const gate = (covenant, observation) => verifyFundingGate(packet, covenant, { chain: observation }, { approvedCovenantDigest: covenant.integrity.covenantDigest, usedProofIds: [] });
const observeEvm = (rpc = evmRpc, covenant = evmCovenant) => observePublicSettlement(covenant, evmHash, { rpcUrl: 'https://rpc.example.test', fetchFn: mockRpc(rpc) });

await check('fixture remains priced with the original numeric results', () => {
  assert.equal(packet.state, 'scope_change_detected');
  assert.deepEqual(packet.marginSnapshot.knownAddedHours, { min: 26, max: 33 });
  assert.deepEqual(packet.marginSnapshot.completeTotalFeeRange, { min: 487.5, max: 618.75 });
  assert.equal(verifyMarginPacket(packet).valid, true);
});
for (const reverse of [false, true]) await check('partial overlapping delay rejected, reverse=' + reverse, () => {
  const input = clone(fixture);
  input.dependencies = [
    { ...input.dependencies[0], id: 'partial-one', evidenceQuote: 'credentials were supplied two days' },
    { ...input.dependencies[0], id: 'partial-two', evidenceQuote: 'supplied two days after the agreed access date' },
  ];
  if (reverse) input.dependencies.reverse();
  assert.throws(() => buildMarginPacket(input), /overlapping evidence/);
});
await check('ambiguous repeated evidence is rejected', () => {
  const input = clone(fixture);
  input.sources.find(s => s.id === 'access-delay-email').quote += ' Again supplied two days after.';
  assert.throws(() => buildMarginPacket(input), /ambiguous repeated evidence/);
});
await check('distinct delay evidence in same email remains valid', () => {
  const input = clone(fixture);
  input.sources.find(s => s.id === 'access-delay-email').quote += ' Approved assets arrived one day late.';
  input.dependencies.push({ id: 'assets-delay', label: 'Assets late', owner: 'client', delayDays: 1, sourceRef: 'access-delay-email', evidenceQuote: 'Approved assets arrived one day late' });
  assert.equal(buildMarginPacket(input).delayAttribution.totalDaysByOwner.client, 3);
});
await check('normalized whitespace does not bypass partial overlap', () => {
  const input = clone(fixture);
  input.dependencies = [
    { ...input.dependencies[0], id: 'partial-one', evidenceQuote: 'credentials  were supplied\n two days' },
    { ...input.dependencies[0], id: 'partial-two', evidenceQuote: 'supplied\t two days after the agreed access date' },
  ];
  assert.throws(() => buildMarginPacket(input), /overlapping evidence/);
});

const sameInput = clone(fixture);
sameInput.baseline.pricing.currency = 'USDC';
const samePacket = buildMarginPacket(sameInput);
const sameTerms = clone(baseTerms);
sameTerms.price.currency = 'USDC';
sameTerms.price.amount = '487.5000';
sameTerms.settlement = { chain: 'base', assetSymbol: 'USDC', assetId: '0x3333333333333333333333333333333333333333', decimals: 18, amount: '487.500000000000000000', destination: baseTerms.settlement.destination };
delete sameTerms.conversion;
await check('same-asset numerically equal trailing zeros accepted', () => {
  assert.equal(buildFundingCovenant(samePacket, sameTerms).settlement.amountAtomic, '487500000000000000000');
});
for (const amount of ['487.499999999999999999', '487.500000000000000001', '1']) await check('same-asset mismatch rejected: ' + amount, () => {
  const terms = clone(sameTerms); terms.settlement.amount = amount;
  assert.throws(() => buildFundingCovenant(samePacket, terms), /same-asset settlement amount/);
});
await check('same-asset explicit conversion is restricted', () => {
  const terms = clone(sameTerms); terms.conversion = { mode: 'owner_fixed', sourceRef: 'synthetic' };
  assert.throws(() => buildFundingCovenant(samePacket, terms), /same_asset/);
  terms.conversion = { mode: 'same_asset' };
  assert.equal(buildFundingCovenant(samePacket, terms).conversion.mode, 'same_asset');
});

await check('valid native Base inclusion still funds and reauthenticates', async () => {
  const result = gate(evmCovenant, await observeEvm());
  assert.equal(result.status, 'FUNDED');
  const receipt = await verifyPublicFundingReceiptLive(result.publicReceipt, evmCovenant, { approvedCovenantDigest: evmCovenant.integrity.covenantDigest, rpcUrl: 'https://rpc.example.test', fetchFn: mockRpc(evmRpc) });
  assert.equal(receipt.valid, true);
});
const evmMutations = {
  'orphaned receipt': rpc => { rpc.eth_getBlockByNumber.hash = replacementHash; },
  'wrong transaction block hash': rpc => { rpc.eth_getTransactionByHash.blockHash = replacementHash; },
  'wrong receipt block hash': rpc => { rpc.eth_getTransactionReceipt.blockHash = replacementHash; },
  'wrong canonical block number': rpc => { rpc.eth_getBlockByNumber.number = '0x65'; },
  'transaction absent from canonical block': rpc => { rpc.eth_getBlockByNumber.transactions = []; },
  'missing canonical block hash': rpc => { delete rpc.eth_getBlockByNumber.hash; },
};
for (const [name, mutate] of Object.entries(evmMutations)) await check('Base rejects ' + name, async () => {
  const rpc = clone(evmRpc); mutate(rpc);
  await assert.rejects(observeEvm(rpc));
});

const genesis = { 'mainnet-beta': '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d', devnet: 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG', testnet: '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY' };
const solTerms = clone(baseTerms);
solTerms.settlement = { chain: 'mainnet-beta', assetSymbol: 'SOL', assetId: 'native', decimals: 9, amount: '1', destination: owner };
const solCovenant = buildFundingCovenant(packet, solTerms);
const solTransaction = {
  blockTime: 1790092800, meta: { err: null, innerInstructions: [], preBalances: [2000000000, 100000000], postBalances: [999995000, 1100000000] },
  transaction: { signatures: [signature], message: { accountKeys: [{ pubkey: '8'.repeat(44) }, { pubkey: owner }], instructions: [{ program: 'system', parsed: { type: 'transfer', info: { destination: owner, lamports: 1000000000 } } }] } },
};
async function observeSol(covenant, transaction = solTransaction, returnedGenesis = genesis[covenant.settlement.chain], calls = []) {
  return observePublicSettlement(covenant, signature, { rpcUrl: 'https://api.devnet.solana.com', fetchFn: mockRpc({ getGenesisHash: returnedGenesis, getTransaction: transaction }, calls) });
}
for (const chain of Object.keys(genesis)) await check('Solana correct genesis accepted: ' + chain, async () => {
  const terms = clone(solTerms); terms.settlement.chain = chain;
  const covenant = buildFundingCovenant(packet, terms);
  const calls = [];
  assert.equal(gate(covenant, await observeSol(covenant, solTransaction, genesis[chain], calls)).status, 'FUNDED');
  assert.deepEqual(calls.map(c => c.method), ['getGenesisHash', 'getTransaction']);
});
await check('Solana devnet genesis rejected for mainnet before transaction read', async () => {
  const calls = [];
  await assert.rejects(observeSol(solCovenant, solTransaction, genesis.devnet, calls), /cluster does not match/);
  assert.deepEqual(calls.map(c => c.method), ['getGenesisHash']);
});

const splTerms = clone(solTerms);
splTerms.settlement = { chain: 'devnet', assetSymbol: 'TEST', assetId: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', decimals: 6, amount: '487.5', destination: owner };
const splCovenant = buildFundingCovenant(packet, splTerms);
const tokenAccounts = ['7'.repeat(44), '6'.repeat(44), '5'.repeat(44)];
const balance = (accountIndex, accountOwner, amount) => ({ accountIndex, owner: accountOwner, mint: splTerms.settlement.assetId, uiTokenAmount: { amount, decimals: 6 } });
const splTransaction = {
  blockTime: 1790092800,
  meta: { err: null, innerInstructions: [], preTokenBalances: [balance(0, owner, '0'), balance(1, owner, '487500000'), balance(2, '8'.repeat(44), '0')], postTokenBalances: [balance(0, owner, '487500000'), balance(1, owner, '487500000'), balance(2, '8'.repeat(44), '0')] },
  transaction: { signatures: [signature], message: { accountKeys: tokenAccounts.map(pubkey => ({ pubkey })), instructions: [{ program: 'spl-token', parsed: { type: 'transferChecked', info: { destination: tokenAccounts[0], mint: splTerms.settlement.assetId, tokenAmount: { amount: '487500000', decimals: 6 } } } }] } },
};
await check('SPL exact aggregate credit remains funded', async () => {
  assert.equal(gate(splCovenant, await observeSol(splCovenant, splTransaction)).status, 'FUNDED');
});
await check('SPL outgoing debit from second owner account is rejected', async () => {
  const tx = clone(splTransaction); tx.meta.postTokenBalances[1].uiTokenAmount.amount = '0';
  tx.meta.postTokenBalances[2].uiTokenAmount.amount = '487500000';
  tx.transaction.message.instructions.push({ program: 'spl-token', parsed: { type: 'transferChecked', info: { source: tokenAccounts[1], destination: tokenAccounts[2], mint: splTerms.settlement.assetId, tokenAmount: { amount: '487500000', decimals: 6 } } } });
  await assert.rejects(observeSol(splCovenant, tx), /net balance increase/);
});
await check('SPL debit from a closed owner account is included', async () => {
  const tx = clone(splTransaction); tx.meta.postTokenBalances.splice(1, 1);
  await assert.rejects(observeSol(splCovenant, tx), /net balance increase/);
});
await check('newly created SPL recipient account remains supported', async () => {
  const tx = clone(splTransaction); tx.meta.preTokenBalances.splice(0, 1);
  assert.equal(gate(splCovenant, await observeSol(splCovenant, tx)).status, 'FUNDED');
});
await check('duplicate SPL aggregate balance entries reject', async () => {
  const tx = clone(splTransaction); tx.meta.preTokenBalances.push(clone(tx.meta.preTokenBalances[1]));
  await assert.rejects(observeSol(splCovenant, tx), /ambiguous/);
});

const safeEmail = { id: 'synthetic-baseline', body: LIVE_BASELINE_BODY, date: '2026-08-10T12:00:00Z', scan_status: 'clean', agent_safe_content: true, folder_id: 'Inbox', content_omitted: false, content_truncated: false };
await check('live helper accepts safe selected evidence', () => {
  assert.equal(resolveSelectedEmailEvidence([{ email: clone(safeEmail) }], safeEmail.id, ['one responsive landing page']).email.id, safeEmail.id);
});
for (const [field, value] of Object.entries({ id: 'wrong-id', body: '', scan_status: 'malicious', agent_safe_content: false, content_omitted: true, content_truncated: true })) await check('live helper rejects ' + field, () => {
  const email = { ...safeEmail, [field]: value };
  assert.throws(() => resolveSelectedEmailEvidence([{ email, unrelated_note: LIVE_BASELINE_BODY }], safeEmail.id, ['one responsive landing page']));
});
await check('live helper accepts repeated identical projection', () => {
  const receipt = resolveSelectedEmailEvidence([{ email: clone(safeEmail) }, { email: clone(safeEmail) }], safeEmail.id, ['one responsive landing page']);
  assert.equal(receipt.email.id, safeEmail.id);
});
await check('live helper rejects conflicting projection copies', () => {
  assert.throws(() => resolveSelectedEmailEvidence([{ email: clone(safeEmail) }, { email: { ...safeEmail, content_truncated: true } }], safeEmail.id, ['one responsive landing page']));
});
await check('live helper accepts semantically identical projections with reordered JSON keys', () => {
  const reordered = Object.fromEntries(Object.entries(safeEmail).reverse());
  const receipt = resolveSelectedEmailEvidence([{ email: clone(safeEmail) }, { email: reordered }], safeEmail.id, ['one responsive landing page']);
  assert.equal(receipt.email.id, safeEmail.id);
});

const files = ['skills/mermail-freelance-margin-guard/scripts/build-margin-packet.mjs', 'skills/mermail-freelance-margin-guard/scripts/funding-gate.mjs', 'skills/mermail-freelance-margin-guard/scripts/run-live-proof.mjs', 'skills/mermail-mcp/scripts/check-connection.mjs', 'scripts/clawhub-ci-publish.py', 'scripts/publish-clawhub.sh', 'tests/validate.mjs'];
const hashes = Object.fromEntries(await Promise.all(files.map(async file => [file, createHash('sha256').update(await readFile(new URL('../source/' + file, import.meta.url))).digest('hex')])));
await writeFile(new URL('./after-source-sha256.json', import.meta.url), JSON.stringify(hashes, null, 2) + '\n');
await writeFile(new URL('./after-results.json', import.meta.url), JSON.stringify({ passes: results.filter(r => r.pass).length, failures: results.filter(r => !r.pass).length, results }, null, 2) + '\n');
for (const result of results) process.stdout.write((result.pass ? 'PASS ' : 'FAIL ') + result.name + (result.error ? ': ' + result.error : '') + '\n');
process.exitCode = results.some(r => !r.pass) ? 1 : 0;
