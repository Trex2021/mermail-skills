import fs from 'node:fs';
import readline from 'node:readline';
import {pathToFileURL} from 'node:url';
import {checkRead, decodeRpc, projectRecords, primaryRecords, bodyText, objects, payloads, retryDelay} from '../pr124-behavior/adapter.mjs';
import {freezePreview, requireSaveAuthority, verifyReadback, must} from './guard.mjs';

const scope = JSON.parse(fs.readFileSync(process.env.SCOPE_FILE,'utf8'));
const read = new Set(['list_mailboxes','search_emails','get_email_context','get_email']);
const wrap = v => ({structuredContent:v, content:[{type:'text',text:JSON.stringify(v)}]});
const readJson = p => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p,'utf8')) : null;
const audit = () => fs.existsSync(process.env.AUDIT_FILE) ? fs.readFileSync(process.env.AUDIT_FILE,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];
const record = v => fs.appendFileSync(process.env.AUDIT_FILE,JSON.stringify({at:new Date().toISOString(),...v})+'\n');
let id=0, initialized=false, nextAt=0, tools;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function rpc(method,params={}) {
  const write=method==='tools/call'&&params.name==='save_draft';
  for(let attempt=0;attempt<(write?1:4);attempt++) {
    await wait(Math.max(0,nextAt-Date.now())); nextAt=Date.now()+3200;
    let response, envelope;
    try {
      response=await fetch('https://console.mermail.app/mcp',{method:'POST',redirect:'error',signal:AbortSignal.timeout(25000),headers:{accept:'application/json, text/event-stream','content-type':'application/json','x-api-key':process.env.MERMAIL_API_KEY},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params})});
      envelope=await decodeRpc(response);
    } catch { if(write||attempt===3) throw new Error(write?'write_outcome_unknown_no_retry':'live_network_failed'); await wait(2000); continue; }
    if(!write && (response.status===429 || /rate[_ -]?limit/i.test(JSON.stringify(envelope.error||{}))) && attempt<3) {await wait(retryDelay(response,attempt));continue;}
    must(response.ok&&!envelope.error&&envelope.result?.isError!==true,write?'write_rejected_or_uncertain_no_retry':'live_read_rejected');
    return envelope.result;
  }
}
async function ensure() {
  if(initialized)return;
  await rpc('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'pr124-native-client-scoped-adapter',version:'1.0.0'}});
  initialized=true;
}
async function handle({method,params={}}) {
  if(method==='initialize')return {protocolVersion:'2025-03-26',capabilities:{tools:{}},serverInfo:{name:'mermail-demo',version:'1.0.0'}};
  if(method==='ping')return {};
  if(method==='tools/list') {
    await ensure();
    if(!tools) {
      const all=(await rpc('tools/list')).tools||[];
      tools=all.filter(t=>read.has(t.name)||['save_draft','send_email','reply_to_email'].includes(t.name));
      must([...read,'save_draft'].every(n=>tools.some(t=>t.name===n)),'production_contract_missing');
      const saveSchema=structuredClone(all.find(t=>t.name==='save_draft').inputSchema);
      tools.push({name:'build_margin_packet',description:'Local execution adapter invoking the installed plugin deterministic builder. Use references/input-schema.md. Host-held live selected email receipts bind source ids, dates and contiguous quotations. This is not a production Mermail tool.',inputSchema:{type:'object',properties:{input:{type:'object'}},required:['input'],additionalProperties:false}});
      tools.push({name:'freeze_draft_preview',description:'Local approval adapter, not a production tool. Register your exact native save_draft arguments and the verified packet digest before asking approval. Use the production argument schema below: mailboxId is at the top level; from/to/cc/bcc/subject/body/body_format/attachments are within body. Explicitly provide cc:[], bcc:[], attachments:[] and body_format:"text". From and To must both equal the discovered test mailbox. This performs no save or send and returns the frozen preview plus its SHA-256. Native save_draft is blocked until the operator explicitly approves this exact preview.',inputSchema:{type:'object',properties:{arguments:saveSchema,packetDigest:{type:'string'}},required:['arguments','packetDigest'],additionalProperties:false}});
    }
    return {tools};
  }
  must(method==='tools/call','unsupported_method');
  const name=params.name,args=params.arguments||{};
  if(['send_email','reply_to_email'].includes(name)) {record({tool:name,kind:'forbidden_write',forwarded:false});throw new Error('external_sends_forbidden');}
  if(name==='build_margin_packet') {
    const builder=await import(pathToFileURL(process.env.BUILDER_PATH).href);
    const receipts=readJson(process.env.RECEIPTS_FILE)||[];
    must(receipts.length===2,'both_live_selected_reads_required');
    try {
      const correspondence=builder.verifySelectedEmailEvidence(args.input,receipts);
      const packet=builder.buildMarginPacket(args.input,{observedEmails:receipts});
      must(builder.verifyMarginPacket(packet).valid&&correspondence.valid,'source_or_packet_invalid');
      fs.writeFileSync(process.env.PACKET_FILE,JSON.stringify(packet),{mode:0o600});
      record({tool:name,kind:'local_builder',success:true,sourceEvidenceValid:true,verifiedEmailSources:correspondence.verifiedEmailSources,packetDigest:packet.integrity.packetDigest});
      return wrap({packet,correspondence});
    } catch(e) {record({tool:name,kind:'local_builder',success:false});return {isError:true,content:[{type:'text',text:String(e.message).replace(/[^\x20-\x7e]/g,'').slice(0,240)}]};}
  }
  if(name==='freeze_draft_preview') {
    const frozen=freezePreview(args.arguments,args.packetDigest,scope,readJson(process.env.PACKET_FILE));
    fs.writeFileSync(process.env.PREVIEW_FILE,JSON.stringify(frozen),{mode:0o600});
    record({tool:name,kind:'preview_frozen',success:true,previewDigest:frozen.previewDigest,forwarded:false});
    return wrap({...frozen,saved:false,sent:false,state:'awaiting_exact_internal_draft_approval'});
  }
  if(name==='save_draft') {
    const frozen=readJson(process.env.PREVIEW_FILE),packet=readJson(process.env.PACKET_FILE),gate=readJson(process.env.GATE_FILE);
    try {requireSaveAuthority(args,frozen,gate,audit(),packet);}catch(e){record({tool:name,kind:'blocked_save',forwarded:false,code:e.code});throw e;}
    record({tool:name,kind:'save_attempt',forwarded:true,previewDigest:frozen.previewDigest});
    await ensure();
    const result=await rpc('tools/call',{name,arguments:args});
    const ids=[...new Set(objects(payloads(result)).flatMap(o=>[o.draft_id||o.draftId||(o.subject===frozen.preview.arguments.body.subject?(o.id||o.email_id||o.emailId):null)]).filter(Boolean))];
    must(ids.length===1,'saved_draft_identity_uncertain_no_retry');
    fs.writeFileSync(process.env.SAVED_FILE,JSON.stringify({draftId:ids[0],previewDigest:frozen.previewDigest}),{mode:0o600});
    record({tool:name,kind:'save_completed',success:true,forwarded:true});
    return result;
  }
  must(read.has(name),'tool_not_allowed');
  const saved=readJson(process.env.SAVED_FILE);
  if(name==='get_email'&&saved&&args.mailboxId===scope.mailbox.id&&args.emailId===saved.draftId) {
    must(args.query?.agent_safe_content===true&&Number(args.query.max_body_chars)>0&&Number(args.query.max_body_chars)<=10000,'unsafe_draft_read');
    await ensure();
    const result=await rpc('tools/call',{name,arguments:args});
    const candidates=primaryRecords(result,[{id:saved.draftId,subject:readJson(process.env.PREVIEW_FILE).preview.arguments.body.subject}],false);
    const email=candidates.find(o=>bodyText(o));
    must(email,'draft_body_missing');
    const verified=verifyReadback(email,saved.draftId,readJson(process.env.PREVIEW_FILE));
    fs.writeFileSync(process.env.READBACK_FILE,JSON.stringify({verified,email}),{mode:0o600});
    record({tool:name,kind:'live_draft_readback',success:true,forwarded:true,bodyHash:verified.bodyHash,sent:false});
    return wrap({email});
  }
  const reason=checkRead(name,args,scope);must(!reason,reason||'unsafe_read');
  await ensure();
  const result=await rpc('tools/call',{name,arguments:args});
  if(name==='list_mailboxes') {record({tool:name,kind:'live_read',success:true,forwarded:true});return wrap({mailboxes:[scope.mailbox.metadata]});}
  const records=projectRecords(result,scope.messages,name==='get_email'||name==='get_email_context',name==='get_email_context');
  const selected=records.find(o=>o.id===args.emailId);
  const slot=scope.messages.find(m=>m.id===args.emailId)?.slot;
  record({tool:name,kind:'live_read',success:true,forwarded:true,...(slot?{slot,bodyPresent:Boolean(bodyText(selected)),scanStatus:selected?.scan_status??null}:{})});
  if(name==='search_emails')return wrap({emails:records});
  must(selected&&bodyText(selected)&&!selected.content_omitted,'selected_safe_body_missing');
  const receipts=readJson(process.env.RECEIPTS_FILE)||[];
  fs.writeFileSync(process.env.RECEIPTS_FILE,JSON.stringify([...receipts.filter(r=>r.email.id!==selected.id),{tool:name,email:selected}]),{mode:0o600});
  return wrap({email:selected});
}
for await(const line of readline.createInterface({input:process.stdin})) {
  let req;try{req=JSON.parse(line);}catch{continue;}
  if(req.id==null)continue;
  try{process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:req.id,result:await handle(req)})+'\n');}
  catch(e){process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:req.id,error:{code:-32000,message:/^[a-z_]+$/.test(e.code||e.message)?e.code||e.message:'scoped_adapter_stopped'}})+'\n');}
}
