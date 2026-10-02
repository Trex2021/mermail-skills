import fs from 'node:fs';
import path from 'node:path';

const publicDir = path.join(process.env.RUNNER_TEMP, 'pr124-readiness');
fs.mkdirSync(publicDir, {recursive:true, mode:0o700});
const report = {checkedAt:new Date().toISOString(), writes:0, mailbox:{}, selectedMessages:[], contracts:[]};
let id=0, nextAt=0;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function rpc(method,params={}) {
  for(let attempt=0;attempt<4;attempt++) {
    await wait(Math.max(0,nextAt-Date.now())); nextAt=Date.now()+2200;
    const res=await fetch('https://console.mermail.app/mcp',{method:'POST',signal:AbortSignal.timeout(30000),headers:{accept:'application/json, text/event-stream','content-type':'application/json','x-api-key':process.env.MERMAIL_API_KEY},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params})});
    const text=await res.text();
    let v;
    try { v=JSON.parse(text); } catch { v=text.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>{try{return JSON.parse(l.slice(5))}catch{return null}}).find(o=>o?.id===id); }
    if(res.status===429){await wait(1500*2**attempt);continue;}
    if(!res.ok||!v||v.error)throw new Error('readonly_rpc_unavailable');
    return v.result;
  }
  throw new Error('readonly_rate_limit');
}
const call=(name,args)=>rpc('tools/call',{name,arguments:args});
function payloads(r){const p=r.structuredContent===undefined?[]:[r.structuredContent];for(const c of r.content||[])if(c.type==='text'){try{p.push(JSON.parse(c.text));}catch{}}return p;}
function walk(o,a=[]){if(!o||typeof o!=='object')return a;if(!Array.isArray(o))a.push(o);for(const x of Object.values(o))walk(x,a);return a;}
const str=(o,ks)=>ks.map(k=>o?.[k]).find(v=>typeof v==='string'&&v.trim());
const safeStatus=v=>typeof v==='string'&&/^[a-zA-Z_ -]{1,80}$/.test(v)?v:v===null?null:undefined;
function shape(r){
  const os=walk(payloads(r));
  return {isError:r.isError===true, objectKeys:[...new Set(os.flatMap(o=>Object.keys(o)))].sort(), records:os.filter(o=>Object.hasOwn(o,'scan_status')||Object.hasOwn(o,'content_omitted')||Object.hasOwn(o,'is_incoming')).map(o=>({scan_status:safeStatus(o.scan_status),content_omitted:o.content_omitted,content_omission_reason:safeStatus(o.content_omission_reason),is_incoming:o.is_incoming,is_sent:o.is_sent,is_draft:o.is_draft,direction:safeStatus(o.direction),status:safeStatus(o.status),bodyPresent:['body','body_text','text','html','content'].some(k=>typeof o[k]==='string'&&o[k].trim().length>0),senderMatchesSelectedMailbox:[o.sender,o.from].filter(x=>typeof x==='string').some(x=>x.toLowerCase().includes(mailbox.email.toLowerCase())),folder_kind:['inbox','sent'].find(f=>String(o.folder_name||o.folder||o.folder_id||'').toLowerCase()===f)||'other'}))};
}
let mailbox;
try {
  await rpc('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'pr124-safe-source-readiness',version:'1.0.0'}});
  const ts=(await rpc('tools/list')).tools||[];
  report.toolCount=ts.length;
  report.scanToolsAdvertised=ts.map(t=>t.name).filter(n=>/scan|security/i.test(n));
  report.contracts=ts.filter(t=>['list_mailboxes','get_mailbox','list_folders','list_emails','search_emails','get_email','get_email_context'].includes(t.name));
  const boxes=walk(payloads(await call('list_mailboxes',{}))).map(o=>({id:str(o,['public_id','publicId','mailbox_id','mailboxId','id']),email:str(o,['email','email_address','emailAddress','address']),can_receive:o.can_receive,receiving_status:safeStatus(o.receiving_status),status:safeStatus(o.status)})).filter(o=>o.id&&o.email?.includes('@'));
  const unique=[...new Map(boxes.map(b=>[b.id,b])).values()];
  if(unique.length!==1)throw new Error('test_mailbox_ambiguous');
  mailbox=unique[0];
  report.mailbox={can_receive:mailbox.can_receive,receiving_status:mailbox.receiving_status,status:mailbox.status};
  if(ts.some(t=>t.name==='get_mailbox')){
    const os=walk(payloads(await call('get_mailbox',{mailboxId:mailbox.id})));
    report.mailboxDetails=os.filter(o=>Object.hasOwn(o,'can_receive')).map(o=>({can_receive:o.can_receive,receiving_status:safeStatus(o.receiving_status),status:safeStatus(o.status)}));
  }
  let folders=[];
  if(ts.some(t=>t.name==='list_folders')){
    folders=walk(payloads(await call('list_folders',{mailboxId:mailbox.id}))).map(o=>({id:str(o,['id','folder_id']),name:str(o,['name','folder_name'])})).filter(o=>o.id&&['inbox','sent'].includes(o.name?.toLowerCase()));
    report.folderKinds=[...new Set(folders.map(f=>f.name.toLowerCase()))];
  }
  for(const [slot,suffix] of [['baseline','Accepted scope'],['request','Change request']]){
    const subject='[FMG-LIVE-34372972140-1] '+suffix;
    const result=await call('search_emails',{mailboxId:mailbox.id,query:{subject,page:1,limit:20,metadata_only:true,agent_safe_content:true}});
    const os=walk(payloads(result));
    const matches=[...new Map(os.filter(o=>o.subject===subject&&typeof o.id==='string').map(o=>[o.id,o])).values()];
    report.selectedMessages.push({slot,variantCount:matches.length,searchError:result.isError===true,variants:[]});
    for(const m of matches.slice(0,4)){
      const item={folder_kind:folders.find(f=>f.id===m.folder_id)?.name.toLowerCase()||safeStatus(m.folder_name)||safeStatus(m.folder_id),scan_status:safeStatus(m.scan_status)};
      item.cleanGet=shape(await call('get_email',{mailboxId:mailbox.id,emailId:m.id,query:{require_scan_status:'clean',agent_safe_content:true,max_body_chars:10000}}));
      if(ts.some(t=>t.name==='get_email_context'))item.safeContext=shape(await call('get_email_context',{mailboxId:mailbox.id,emailId:m.id,query:{limit:1}}));
      report.selectedMessages.at(-1).variants.push(item);
    }
    const clean=await call('search_emails',{mailboxId:mailbox.id,query:{subject,page:1,limit:20,metadata_only:true,require_scan_status:'clean',agent_safe_content:true}});
    report.selectedMessages.at(-1).cleanVariantCount=new Set(walk(payloads(clean)).filter(o=>o.subject===subject&&typeof o.id==='string').map(o=>o.id)).size;
  }
}catch(e){report.error=/^[a-z_]+$/.test(e.message)?e.message:'readiness_failed';process.exitCode=1;}
fs.writeFileSync(path.join(publicDir,'readiness.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({checkedAt:report.checkedAt,writes:0,toolCount:report.toolCount,mailbox:report.mailbox,selected:report.selectedMessages,error:report.error}));
