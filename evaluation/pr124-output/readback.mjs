import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {PRODUCT,check,sha,makeRpc,prepare,makePreview,encryptReview} from './output.mjs';
import {primaryRecords,bodyText} from '../pr124-behavior/adapter.mjs';

const addresses = value => [...new Set((JSON.stringify(value ?? '').match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []).map(v=>v.toLowerCase()))];

// Only a previously approved, byte-identical internal draft may be read here.
// This entry point always uses prepare-mode transport; it has no write path.
export async function verifyExisting(prepared, approval, remote) {
  // The original create payload may have no draft_id. Reading that existing
  // item adds its ID and changes the idempotency key, but no approved content.
  const withoutExistingId = preview => {
    const copy=structuredClone(preview);
    delete copy.arguments.body.draft_id;
    delete copy.arguments.idempotencyKey;
    return copy;
  };
  const creation=prepared.creationPreview;
  const creationMatches=creation && sha(creation)===approval.approvedPreviewDigest &&
    sha(withoutExistingId(creation))===sha(withoutExistingId(prepared.preview));
  check(/^[a-f0-9]{64}$/.test(approval.approvedPreviewDigest || '') &&
    sha(prepared.preview) === prepared.previewDigest &&
    (prepared.previewDigest === approval.approvedPreviewDigest || creationMatches),
    'historical_exact_preview_changed');
  check(prepared.packet.integrity.packetDigest === approval.expectedPacketDigest,
    'historical_packet_changed');
  const p=prepared.preview, b=p.arguments.body, draftId=b.draft_id;
  check(typeof draftId === 'string' && draftId.trim() && p.from===prepared.mailbox.email &&
    p.to.length===1 && p.to[0]===p.from && !p.cc.length && !p.bcc.length &&
    b.from===p.from && b.to===p.from && !b.cc.length && !b.bcc.length &&
    b.subject===p.subject && b.body===p.body && !b.attachments.length,
    'existing_approved_self_draft_missing');
  const read=await remote('tools/call',{name:'get_email',arguments:{
    mailboxId:prepared.mailbox.id,emailId:draftId,
    query:{agent_safe_content:true,max_body_chars:10000}
  }});
  const actual=primaryRecords(read,[{id:draftId,subject:p.subject}],false)[0];
  check(actual.agent_safe_content===true && !actual.content_omitted && !actual.content_truncated,
    'draft_safe_primary_projection_missing');
  check(/^(drafts|draft)$/i.test(String(actual.folder_name||actual.folder_id||actual.status||'')),
    'existing_item_not_unsent_draft');
  check(addresses(actual.sender??actual.from).length===1 && addresses(actual.sender??actual.from)[0]===p.from.toLowerCase() &&
    addresses(actual.recipient??actual.to).length===1 && addresses(actual.recipient??actual.to)[0]===p.from.toLowerCase() &&
    !addresses(actual.cc).length && !addresses(actual.bcc).length &&
    (!Array.isArray(actual.attachments) || !actual.attachments.length),
    'draft_headers_or_attachments_changed');
  const observedBody=bodyText(actual).replace(/\r\n/g,'\n');
  check(observedBody===p.body && sha(observedBody)===sha(p.body),'approved_draft_body_changed');
  return {readbackVerified:true,sent:false,bodySha256:sha(observedBody),draftId};
}

export function publicProjection(prepared, outcome, audit, config) {
  check(!addresses(prepared.preview.body).length,'public_body_contains_address');
  const hidden=[prepared.mailbox.id,prepared.mailbox.email,outcome.draftId,
    ...prepared.messages.flatMap(m=>[m.id,m.email.thread_id,m.email.message_id])].filter(v=>typeof v==='string'&&v.length>3);
  const redact=text=>hidden.reduce((s,value)=>s.split(value).join('[redacted identifier]'),String(text));
  const status={status:'CURRENT_PRODUCT_RECOMPUTED_AND_EXISTING_APPROVED_DRAFT_READ_BACK',
    productHead:PRODUCT,historicalSaveRun:config.historicalSaveRun,
    checkedAt:new Date().toISOString(),runId:process.env.GITHUB_RUN_ID??null,
    harnessHead:process.env.GITHUB_SHA??null,previewDigest:prepared.previewDigest,
    approvedCreationPreviewDigest:config.approvedPreviewDigest,
    packetDigest:prepared.packet.integrity.packetDigest,bodySha256:outcome.bodySha256,
    verifiedEmailSources:prepared.correspondence.verifiedEmailSources,
    readbackVerified:outcome.readbackVerified,saveAttempts:audit.filter(a=>a.writeAttempt).length,
    externalSends:0,margin:prepared.packet.marginSnapshot,
    revision:prepared.packet.baseline.revisionBudget,options:prepared.packet.clientOptions,
    sourceNotes:{syntheticSelfAddressed:true,folder:'Sent',scanStatus:prepared.messages.map(m=>m.email.scan_status??null),senderAuthentication:'unknown'},
    audit};
  check(status.saveAttempts===0,'unexpected_write_attempt');
  const ledger=prepared.messages.map(m=>({slot:m.slot,subject:m.subject,date:m.email.date,
    folder:m.email.folder_name??m.email.folder_id,scanStatus:m.email.scan_status??null,
    identity:'owner-selected synthetic self-addressed message; identifiers withheld'}));
  return {status,ledger,body:redact(prepared.preview.body),markdown:
    'Public projection: original private identifiers are redacted. This representation cannot reauthenticate the private source digests.\n\n'+redact(prepared.reportMarkdown)};
}

async function main() {
  const config=JSON.parse(fs.readFileSync(process.env.OUTPUT_CONFIG,'utf8'));
  check(config.mode==='prepare' && process.env.MERMAIL_API_KEY && config.reviewPublicKey,'readonly_configuration_missing');
  const root=process.env.PRODUCT_ROOT, dir=process.env.OUTPUT_PUBLIC_ROOT;
  check(root && dir && spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim()===PRODUCT,'product_head_mismatch');
  const helper=await import(pathToFileURL(path.join(root,'skills/mermail-freelance-margin-guard/scripts/run-live-proof.mjs')).href);
  const builder=await import(pathToFileURL(path.join(root,'skills/mermail-freelance-margin-guard/scripts/build-margin-packet.mjs')).href);
  const audit=[], remote=makeRpc(process.env.MERMAIL_API_KEY,'prepare',audit);
  const prepared=await prepare(remote,helper,builder);
  prepared.creationPreview=makePreview(prepared.mailbox,prepared.messages,prepared.packet,null).preview;
  const outcome=await verifyExisting(prepared,config,remote);
  const projection=publicProjection(prepared,outcome,audit,config);
  fs.mkdirSync(dir,{recursive:true,mode:0o700});
  const files={
    'status.json':JSON.stringify(projection.status,null,2),
    'source-ledger.json':JSON.stringify(projection.ledger,null,2),
    'draft-body.txt':projection.body,
    'scope-report.md':projection.markdown,
    'encrypted-review.json':JSON.stringify(encryptReview({productHead:PRODUCT,
      preview:prepared.preview,packet:prepared.packet,messages:prepared.messages,outcome},config.reviewPublicKey),null,2)
  };
  const index={};
  for(const [name,content] of Object.entries(files)){fs.writeFileSync(path.join(dir,name),content);index[name]=sha(content);}
  fs.writeFileSync(path.join(dir,'SHA256SUMS.json'),JSON.stringify(index,null,2));
  console.log('Current product verified two selected synthetic primary sources, recomputed the historically approved exact packet, and read back the unchanged existing unsent draft. Zero write attempts; zero sends.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) main().catch(e=>{
  console.error('Readback stopped: '+(/^[a-z_]+$/.test(e.code||'')?e.code:'safe_validation_failed'));
  process.exitCode=1;
});
