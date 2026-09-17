import { readFile } from "node:fs/promises";
import { verifyMarginGuardProof } from "./margin-guard-proof-core.mjs";

const proofPath = process.argv[2] || new URL("./margin-guard-proof-bundle.json", import.meta.url);
const packet = JSON.parse(await readFile(proofPath, "utf8"));
const result = await verifyMarginGuardProof(packet);

for (const check of result.checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.label}: ${check.detail}`);
}

console.log(`\n${result.valid ? "VALID" : "INVALID"} — ${result.checks.filter((check) => check.pass).length}/${result.checks.length} public proof checks passed.`);
if (!result.valid) process.exitCode = 1;
