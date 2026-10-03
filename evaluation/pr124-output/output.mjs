import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {decodeRpc, payloads, objects, selectedRecords, bodyText, projectRecords} from '../pr124-behavior/adapter.mjs';

export const PRODUCT = '5e79ba3d7b35ed70a625db5b82f03f82d3f65a64';
export const TAG = 'FMG-LIVE-34372972140-1';
export const DRAFT_SUBJECT = '[FMG-PR124-P2] Scope options (synthetic demo)';
const READS = new Set(['list_mailboxes', 'search_emails', 'get_email_context', 'get_email']);
export const canonical = v => v === null || typeof v !== 'object' ? JSON.stringify(v) : Array.isArray(v) ? '[' + v.map(canonical).join(',') + ']' : '{' + Object.keys(v).sort().map(k => JSON.stringify(k)+':'+canonical(v[k])).join(',') + '}';
export const sha = v => crypto.createHash('sha256').update(typeof v === 'string' || Buffer.isBuffer(v) ? v : canonical(v)).digest('hex');
export function check(ok, code) { if (!ok) { const e = new Error(code); e.code = code; throw e; } }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick = (o, fields) => fields.map(k => o?.[k]).find(v => typeof v === 'string' && v.trim());
const emails = value => [...new Set((JSON.stringify(value ?? '').match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []).map(s => s.toLowerCase()))];

export function encryptReview(value, publicDer) {
  const key = crypto.randomBytes(32), nonce = crypto.randomBytes(12);
  const publicKey = crypto.createPublicKey({key: Buffer.from(publicDer, 'base64'), format:'der', type:'spki'});
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  const data = Buffer.concat([cipher.update(canonical(value), 'utf8'), cipher.final()]);
  const encryptedKey = crypto.publicEncrypt({key:publicKey, oaepHash:'sha256', padding:crypto.constants.RSA_PKCS1_OAEP_PADDING}, key);
  return {version:1, algorithm:'RSA-OAEP-SHA256+AES-256-GCM', recipientKeySha256:sha(Buffer.from(publicDer,'base64')), encryptedKey:encryptedKey.toString('base64'), nonce:nonce.toString('base64'), tag:cipher.getAuthTag().toString('base64'), ciphertext:data.toString('base64')};
}

export function makeRpc(apiKey, mode, audit) {
  check(['prepare','save'].includes(mode), 'invalid_mode');
  let id = 0, nextAt = 0;
  return async (method, params={}) => {
    const write = method === 'tools/call' && params.name === 'save_draft';
    check(['initialize','tools/list','tools/call'].includes(method), 'method_not_allowed');
    if (method === 'tools/call') check(READS.has(params.name) || mode === 'save' && write, 'tool_not_allowed');
    const attempts = write ? 1 : 4;
    for (let attempt=0;attempt<attempts;attempt++) {
      await sleep(Math.max(0,nextAt-Date.now())); nextAt=Date.now()+3200;
      let response, envelope;
      try {
        response = await fetch('https://console.mermail.app/mcp',{method:'POST',signal:AbortSignal.timeout(30000),headers:{accept:'application/json, text/event-stream','content-type':'application/json','x-api-key':apiKey},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params})});
        envelope = await decodeRpc(response);
      } catch {
        audit.push({tool:params.name||method,success:false,writeAttempt:write});
        if (write) check(false,'write_outcome_unknown_no_retry');
        if (attempt+1===attempts) check(false,'readonly_network_failure');
        await sleep(2000); continue;
      }
      if (!write && response.status===429 && attempt+1<attempts) {
        const seconds=Number(response.headers.get('retry-after'));
        await sleep(Math.min(15000,Math.max(3200,Number.isFinite(seconds)?seconds*1000:5000))); continue;
      }
      const ok=response.ok && !envelope.error && envelope.result?.isError!==true;
      audit.push({tool:params.name||method,success:ok,writeAttempt:write});
      check(ok,write?'write_rejected_or_unknown_no_retry':'readonly_request_failed');
      return envelope.result;
    }
  };
}

export function makePacket(helper, builder, mailbox, messages) {
  check(messages.length===2 && messages.every(m => emails(m.email.sender).length===1 && emails(m.email.recipient).length===1 && emails(m.email.sender)[0]===mailbox.email.toLowerCase() && emails(m.email.recipient)[0]===mailbox.email.toLowerCase() && emails(m.email.cc).length===0 && emails(m.email.bcc).length===0), 'source_is_not_selected_self_test');
  const baseline=messages.find(m=>m.slot==='baseline'), request=messages.find(m=>m.slot==='request');
  check(baseline&&request&&bodyText(baseline.email).includes(helper.LIVE_BASELINE_BODY)&&bodyText(request.email).includes(helper.LIVE_REQUEST_BODY),'selected_synthetic_source_changed');
  const input=helper.buildLiveMarginInput({baselineMessageId:baseline.id,requestMessageId:request.id,baselineDate:new Date(baseline.email.date).toISOString().slice(0,10),requestDate:new Date(request.email.date).toISOString().slice(0,10)});
  input.project.name=TAG;
  input.sources.find(s=>s.id==='approved-rate').quote='23.50 USD/hour; hypothetical evaluation-only owner input';
  input.sources.find(s=>s.id==='approved-estimate').quote='Dashboard 7-9 hours; Stripe 3-5; login 2-4; two revision rounds together 6-8; earlier delivery itself adds zero labor; hypothetical owner input';
  input.sources.find(s=>s.id==='approved-rush-rule').quote='10 percent of added labor fee; hypothetical owner input';
  input.sources.push({id:'owner-usage',type:'user',label:'Owner-confirmed earlier revision usage',quote:'One of two baseline revision rounds was already used.'});
  input.sources.push({id:'owner-delay',type:'user',label:'Owner-confirmed client-owned access delay',quote:'Client-owned staging-access delay: 2 days; hypothetical owner input.'});
  input.baseline.revisionBudget.usedSourceRef='owner-usage';
  input.baseline.pricing.rate.amount=23.5;
  input.baseline.pricing.rushPremium.percent=10;
  const efforts=[[7,9],[3,5],[2,4],[6,8],[0,0]];
  input.request.items.forEach((item,i)=>Object.assign(item.effortHours,{min:efforts[i][0],max:efforts[i][1]}));
  input.dependencies[0].sourceRef='owner-delay'; delete input.dependencies[0].evidenceQuote;
  const receipts=messages.map(m=>({tool:'get_email_context',email:m.email}));
  const correspondence=builder.verifySelectedEmailEvidence(input,receipts);
  const packet=builder.buildMarginPacket(input,{observedEmails:receipts});
  check(builder.verifyMarginPacket(packet).valid && correspondence.valid && correspondence.verifiedEmailSources===2,'packet_verification_failed');
  check(packet.marginSnapshot.completeTotalFeeRange.min===387.75&&packet.marginSnapshot.completeTotalFeeRange.max===568.7,'unexpected_commercial_result');
  return {input,packet,correspondence,reportMarkdown:builder.renderMarkdown(packet)};
}

export function makePreview(mailbox, messages, packet, existingDraftId=null) {
  const money=n=>Number(n).toFixed(2);
  const range=r=>money(r.min)+'-'+money(r.max)+' USD';
  const base=packet.marginSnapshot.completeBaseFeeRange, total=packet.marginSnapshot.completeTotalFeeRange;
  const revision=packet.baseline.revisionBudget;
  const extension=packet.clientOptions.find(o=>o.id==='extend_schedule').deadlineRange;
  const body=[
    'SYNTHETIC DEMONSTRATION ONLY. These are hypothetical terms, not a contract, payment request or permission to start work.',
    'Thank you for the change request. The accepted baseline remains one responsive landing page with two revision rounds and delivery on 2026-10-20. Acceptance remains responsiveness at the agreed desktop, tablet and mobile breakpoints. The exclusions remain authenticated application/login, admin dashboard and payment processing.',
    'One revision round was already used. Of the two newly requested rounds, one is included and one exceeds the remaining allowance. The included round is not billed as added work.',
    'Added work and owner-supplied estimates: admin dashboard 7-9 hours; Stripe integration 3-5 hours; login 2-4 hours; overflow revision round 3-4 hours. Earlier delivery itself adds zero labor hours. Total billable additions: 15-22 hours.',
    'At the hypothetical owner-approved 23.50 USD/hour, ordinary added fees are '+range(base)+'. The 10% rush premium on added labor is '+range(packet.marginSnapshot.rushPremiumAmountRange)+', giving '+range(total)+' at the requested 2026-10-15 deadline.',
    'The separately owner-attributed staging-access delay is 2 client-owned days. It is distinct from the requested five-calendar-day deadline compression.',
    'Three options for review:\n1. Remove or swap: remove the additions, or agree an effort-equivalent swap; retain the original fee and 2026-10-20 baseline deadline.\n2. Extend the schedule: retain the additions at '+range(base)+' with an indicative calendar extension to '+extension.earliest+'-'+extension.latest+', including the supplied client delay. Confirm working-calendar availability before agreement.\n3. Paid rush change order: retain the additions and requested 2026-10-15 deadline for '+range(total)+', including the stated 10% rush premium.',
    'No option has been accepted, no payment has occurred and no additional work is authorized. Please review the option, exact fee and deadline before any written agreement. This saved draft is not an email delivery.',
    'Evidence: owner-selected "['+TAG+'] Accepted scope" and "['+TAG+'] Change request", dated '+packet.sources.find(s=>s.id==='accepted-proposal').date+'. Both are synthetic self-addressed Sent messages; scan status and sender authentication are unknown. They are not verified client messages.',
    'Packet SHA-256: '+packet.integrity.packetDigest
  ].join('\n\n');
  const identity={mailbox:mailbox.id,subject:DRAFT_SUBJECT,body};
  const args={mailboxId:mailbox.id,body:{from:mailbox.email,to:mailbox.email,cc:[],bcc:[],subject:DRAFT_SUBJECT,body,body_format:'text',attachments:[]}};
  if(existingDraftId) { args.body.draft_id=existingDraftId; identity.draftId=existingDraftId; }
  args.idempotencyKey='pr124-p2-draft-'+sha(identity);
  const preview={action:'save_draft_only',from:mailbox.email,to:[mailbox.email],cc:[],bcc:[],subject:DRAFT_SUBJECT,body,sourceMessages:messages.map(m=>({slot:m.slot,id:m.id,subject:m.subject,date:packet.sources.find(s=>s.messageId===m.id).date,threadId:m.email.thread_id??null})),packetDigest:packet.integrity.packetDigest,arguments:args,threading:'New unsent negotiation draft; source metadata retained for traceability, not a claimed native threaded reply.'};
  return {preview,previewDigest:sha(preview),revision};
}

export async function prepare(remote, helper, builder) {
  await remote('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'pr124-tangible-output',version:'1.0.0'}});
  const tools=(await remote('tools/list')).tools||[];
  const saveSchema=tools.find(t=>t.name==='save_draft')?.inputSchema;
  check(saveSchema && ['list_mailboxes','search_emails','get_email_context','get_email'].every(n=>tools.some(t=>t.name===n)),'required_tools_missing');
  const boxes=objects(payloads(await remote('tools/call',{name:'list_mailboxes',arguments:{}}))).map(o=>({id:pick(o,['public_id','publicId','mailbox_id','mailboxId','id']),email:pick(o,['email','email_address','emailAddress','address']),invalid:o.disabled_at||['disabled','deleted','failed','pending'].includes(String(o.status||o.state).toLowerCase())})).filter(o=>o.id&&o.email?.includes('@')&&!o.invalid);
  const unique=[...new Map(boxes.map(o=>[o.id,o])).values()]; check(unique.length===1,'mailbox_ambiguous'); const mailbox=unique[0];
  const messages=[];
  for(const [slot,suffix] of [['baseline','Accepted scope'],['request','Change request']]) {
    const subject='['+TAG+'] '+suffix;
    const found=await remote('tools/call',{name:'search_emails',arguments:{mailboxId:mailbox.id,query:{subject,metadata_only:true,agent_safe_content:true,page:1,limit:20}}});
    const selected=helper.resolveEmailMetadata(payloads(found),subject);
    const selection={slot,id:selected.id,subject};
    const context=await remote('tools/call',{name:'get_email_context',arguments:{mailboxId:mailbox.id,emailId:selection.id,query:{limit:1}}});
    const records=projectRecords(context,[selection],true,true);
    const email=records.find(o=>o.id===selection.id); check(email&&bodyText(email)&&!email.content_omitted,'selected_safe_content_missing');
    messages.push({...selection,email});
  }
  const foundDrafts=await remote('tools/call',{name:'search_emails',arguments:{mailboxId:mailbox.id,query:{subject:DRAFT_SUBJECT,metadata_only:true,agent_safe_content:true,page:1,limit:20}}});
  const drafts=[...new Map(objects(payloads(foundDrafts)).filter(o=>o.subject===DRAFT_SUBJECT&&String(o.folder_name||o.folder_id||'').toLowerCase()==='drafts').map(o=>[pick(o,['id','email_id','emailId','draft_id']),o])).values()];
  check(drafts.length<=1,'existing_draft_ambiguous');
  const existingDraftId=drafts.length?pick(drafts[0],['id','email_id','emailId','draft_id']):null;
  const packet=makePacket(helper,builder,mailbox,messages);
  return {productHead:PRODUCT,mailbox,messages,...packet,...makePreview(mailbox,messages,packet.packet,existingDraftId),saveSchema};
}

export async function saveApproved(prepared, approvedDigest, remote) {
  check(/^[a-f0-9]{64}$/.test(approvedDigest||'')&&sha(prepared.preview)===approvedDigest&&prepared.previewDigest===approvedDigest,'exact_preview_approval_missing_or_stale');
  const p=prepared.preview;
  const b=p.arguments.body;
  check(p.action==='save_draft_only'&&p.from===prepared.mailbox.email&&p.to.length===1&&p.to[0]===p.from&&!p.cc.length&&!p.bcc.length&&p.arguments.mailboxId===prepared.mailbox.id&&b.from===p.from&&b.to===p.from&&Array.isArray(b.cc)&&!b.cc.length&&Array.isArray(b.bcc)&&!b.bcc.length&&b.subject===p.subject&&b.body===p.body&&b.body_format==='text'&&Array.isArray(b.attachments)&&!b.attachments.length&&Object.keys(b).every(k=>['from','to','cc','bcc','subject','body','body_format','attachments','draft_id'].includes(k))&&Object.keys(p.arguments).every(k=>['mailboxId','body','idempotencyKey'].includes(k)),'self_test_draft_scope_mismatch');
  const saved=await remote('tools/call',{name:'save_draft',arguments:p.arguments});
  const ids=[...new Set(objects(payloads(saved)).map(o=>pick(o,['draft_id','draftId'])||(o.subject===p.subject?pick(o,['id','email_id','emailId']):null)).filter(Boolean))];
  check(ids.length===1,'saved_draft_id_missing_or_ambiguous_no_retry');
  const draftId=ids[0];
  const read=await remote('tools/call',{name:'get_email',arguments:{mailboxId:prepared.mailbox.id,emailId:draftId,query:{agent_safe_content:true,max_body_chars:10000}}});
  const candidates=objects(payloads(read)).filter(o=>pick(o,['id','email_id','emailId','draft_id'])===draftId&&o.subject===p.subject);
  const actual=candidates.find(o=>bodyText(o));
  check(actual&&String(actual.folder_name||actual.folder_id||actual.status||'').toLowerCase().match(/^(drafts|draft)$/),'readback_not_unsent_draft');
  check(!actual.content_omitted&&!actual.content_truncated&&actual.agent_safe_content===true,'readback_safe_content_missing');
  check(emails(actual.recipient??actual.to).length===1&&emails(actual.recipient??actual.to)[0]===p.from.toLowerCase()&&!emails(actual.cc).length&&!emails(actual.bcc).length,'readback_recipients_mismatch');
  check(emails(actual.sender??actual.from).length===1&&emails(actual.sender??actual.from)[0]===p.from.toLowerCase()&&(!Array.isArray(actual.attachments)||actual.attachments.length===0),'readback_sender_or_attachments_mismatch');
  check(bodyText(actual).replace(/\r\n/g,'\n')===p.body&&sha(bodyText(actual).replace(/\r\n/g,'\n'))===sha(p.body),'readback_body_mismatch');
  return {draftId,subject:p.subject,body:p.body,previewDigest:approvedDigest,packetDigest:p.packetDigest,readbackVerified:true,sent:false,checkedAt:new Date().toISOString()};
}

async function main() {
  const config=JSON.parse(fs.readFileSync(process.env.OUTPUT_CONFIG,'utf8'));
  const root=process.env.PRODUCT_ROOT, mode=config.mode, publicDir=process.env.OUTPUT_PUBLIC_ROOT;
  check(root&&publicDir&&process.env.MERMAIL_API_KEY&&config.reviewPublicKey&&['prepare','save'].includes(mode),'configuration_missing');
  check(spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim()===PRODUCT,'product_head_mismatch');
  fs.mkdirSync(publicDir,{recursive:true,mode:0o700});
  const helper=await import(pathToFileURL(path.join(root,'skills/mermail-freelance-margin-guard/scripts/run-live-proof.mjs')).href);
  const builder=await import(pathToFileURL(path.join(root,'skills/mermail-freelance-margin-guard/scripts/build-margin-packet.mjs')).href);
  const audit=[], remote=makeRpc(process.env.MERMAIL_API_KEY,mode,audit);
  const prepared=await prepare(remote,helper,builder);
  let outcome=null;
  if(mode==='save') outcome=await saveApproved(prepared,config.approvedPreviewDigest,remote);
  const report={productHead:PRODUCT,harnessHead:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,mode,status:outcome?'SAVED_AND_READ_BACK':'PREPARED_AWAITING_EXACT_APPROVAL',checkedAt:new Date().toISOString(),previewDigest:prepared.previewDigest,packetDigest:prepared.packet.integrity.packetDigest,verifiedEmailSources:prepared.correspondence.verifiedEmailSources,toolsAvailable:prepared.saveSchema?['save_draft','get_email']:[],margin:prepared.packet.marginSnapshot,revision:prepared.packet.baseline.revisionBudget,options:prepared.packet.clientOptions,sourceNotes:{syntheticSelfAddressed:true,folder:'Sent',scanStatus:prepared.messages.map(m=>m.email.scan_status??null),senderAuthentication:'unknown'},audit,saveAttempts:audit.filter(a=>a.writeAttempt).length,externalSends:0,readbackVerified:outcome?.readbackVerified??false};
  const review={productHead:PRODUCT,runId:process.env.GITHUB_RUN_ID,checkedAt:report.checkedAt,preview:prepared.preview,previewDigest:prepared.previewDigest,packet:prepared.packet,reportMarkdown:prepared.reportMarkdown,sourceMetadata:prepared.messages.map(m=>({slot:m.slot,metadata:m.email})),outcome};
  fs.writeFileSync(path.join(publicDir,'status.json'),JSON.stringify(report,null,2));
  fs.writeFileSync(path.join(publicDir,'save-draft-schema.json'),JSON.stringify(prepared.saveSchema,null,2));
  fs.writeFileSync(path.join(publicDir,'encrypted-review.json'),JSON.stringify(encryptReview(review,config.reviewPublicKey),null,2));
  console.log('Selected self-test sources verified: 2. Packet arithmetic verified.');
  console.log(mode==='save'?'One internal draft saved and read back; no email send tool called.':'Exact preview prepared. No draft or email was written. Owner review is required before save.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) main().catch(e=>{console.error('Output workflow stopped: '+(/^[a-z_]+$/.test(e.code||'')?e.code:'safe_validation_failed'));process.exitCode=1;});
