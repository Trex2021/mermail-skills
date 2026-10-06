import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {makeRpc,prepare,encryptReview} from '../pr124-output/output.mjs';
import {bodyText} from '../pr124-behavior/adapter.mjs';
import {SUBJECT,hash,must,freezePreview,verifyReadback} from './guard.mjs';

const HEAD='c4876e43189c41771fcfa89f30d6cab400257654';
const root=process.env.DEMO_ROOT,product=process.env.PRODUCT_ROOT,harness=path.dirname(new URL(import.meta.url).pathname);
const privateRoot=path.join(root,'private'),publicRoot=path.join(root,'public'),plugin=path.join(root,'plugin'),workspace=path.join(root,'session');
for(const p of [privateRoot,publicRoot,plugin,workspace])fs.mkdirSync(p,{recursive:true,mode:0o700});
must(spawnSync('git',['rev-parse','HEAD'],{cwd:product,encoding:'utf8'}).stdout.trim()===HEAD,'product_head_mismatch');
must(process.env.MERMAIL_API_KEY&&process.env.GITHUB_TOKEN,'existing_test_credentials_missing');
fs.cpSync(path.join(product,'skills'),path.join(plugin,'skills'),{recursive:true});
fs.copyFileSync(path.join(product,'plugin.json'),path.join(plugin,'plugin.json'));
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(p,d.name)):[path.join(p,d.name)]);
const manifest=walk(plugin).map(p=>({path:path.relative(plugin,p),sha256:hash(fs.readFileSync(p))}));
must(manifest.every(f=>hash(fs.readFileSync(path.join(product,f.path)))===f.sha256),'plugin_bytes_mismatch');
fs.writeFileSync(path.join(publicRoot,'product-manifest.json'),JSON.stringify({productHead:HEAD,files:manifest},null,2));
const helper=await import(pathToFileURL(path.join(product,'skills/mermail-freelance-margin-guard/scripts/run-live-proof.mjs')).href);
const builder=await import(pathToFileURL(path.join(product,'skills/mermail-freelance-margin-guard/scripts/build-margin-packet.mjs')).href);
const preflightAudit=[], prepared=await prepare(makeRpc(process.env.MERMAIL_API_KEY,'prepare',preflightAudit),helper,builder);
const scope={mailbox:{...prepared.mailbox,metadata:{public_id:prepared.mailbox.id,email:prepared.mailbox.email}},messages:prepared.messages.map(m=>({slot:m.slot,id:m.id,subject:m.subject})),projectTag:'['+helperTag()+']'};
function helperTag(){return 'FMG-LIVE-34372972140-1';}
const file=k=>path.join(privateRoot,k+'.json');
fs.writeFileSync(file('scope'),JSON.stringify(scope),{mode:0o600});
const auditFile=path.join(privateRoot,'audit.jsonl'),stream=path.join(publicRoot,'terminal.txt');
const transcript=[];
function scrub(value) {
  let s=String(value).replace(/\x1b\[[0-?]*[ -/]*[@-~]/g,'').replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g,'');
  for(const secret of [process.env.MERMAIL_API_KEY,process.env.GITHUB_TOKEN,scope.mailbox.id,scope.mailbox.email,...scope.messages.map(m=>m.id)].filter(Boolean))s=s.split(secret).join('[PRIVATE_ID]');
  if(fs.existsSync(file('saved')))s=s.split(JSON.parse(fs.readFileSync(file('saved'),'utf8')).draftId).join('[PRIVATE_DRAFT_ID]');
  return s.replace(/\b(mailboxId|emailId):\s*"[^"\n]*"/g,'$1: "[PRIVATE_ID]"').replace(/("email"\s*:\s*")[^"\n]*(?:"|$)/g,'$1[TEST_EMAIL]"').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[TEST_EMAIL]').replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,'[PRIVATE_ID]').replace(/\/(?:home|tmp|opt|usr|workspace)\/[^\s"']+/g,'[LOCAL_PATH]').replace(/[\x00-\x08\x0b-\x1f\x7f\u202a-\u202e\u2066-\u2069]/gu,'');
}
function display(s,{clear=false}={}) {
  const safe=scrub(s);
  transcript.push({at:new Date().toISOString(),text:safe});
  // Bound visible lines below the terminal's physical columns. Preserve every
  // character; rendering alone must never truncate an approved/read-back body.
  const rendered=safe.split('\n').map(line=>{const chars=Array.from(line);const rows=[];for(let i=0;i<chars.length;i+=120)rows.push(chars.slice(i,i+120).join(''));return rows.join('\n');}).join('\n');
  fs.appendFileSync(stream,(clear?'\x1b[2J\x1b[H':'')+rendered+'\n');
}
const terms='Owner-supplied hypothetical test terms: USD 23.50/hour; rush premium 10% of added labor; 8 hours/workday. One of the two original revision rounds was already used. Approved estimates: dashboard 7-9h, Stripe 3-5h, login 2-4h, two requested revision rounds together 6-8h. Earlier delivery adds zero labor hours. The staging access delay is client-owned, 2 days.';
const prompt='Compare my owner-selected accepted scope with the later request in my Mermail test mailbox. Exact subjects: "'+scope.messages[0].subject+'" and "'+scope.messages[1].subject+'". Only those two messages may be read. Preserve exclusions and acceptance criteria. '+terms+' Build the evidence-linked decision packet, then prepare a concise English negotiation draft offering all three options. Keep the complete draft below 1500 characters, preferably around 180 words. Use option labels "Remove or swap", "Extend the schedule", and "Paid rush". The draft must explain the remaining included revision, additional hours, ordinary fee, rush total, and all full YYYY-MM-DD dates. Label the entire draft synthetic with hypothetical estimates, and state that no option has been accepted and no work is authorized. The draft recipient and sender are both my own discovered mailbox email, explicitly include cc:[], bcc:[], attachments:[] and body_format:"text". Subject: "'+SUBJECT+'". Use freeze_draft_preview to register the complete exact native save_draft arguments and packet digest, then STOP for operator review; do not save or send yet. Use the appropriate installed plugin skills, whose documentation was loaded before capture without any task data or tools. Local build_margin_packet invokes the shipped deterministic builder and host-held selected source receipts; freeze_draft_preview is only an approval adapter. Do not inspect fixtures, evaluator files, prior runs, run-live-proof.mjs or verification.md. Use only the plugin and this empty workspace. Keep your final response concise and state the frozen preview digest and awaiting-approval state.';
const env={...process.env,COPILOT_HOME:path.join(privateRoot,'copilot-home'),COPILOT_PLUGIN_DIR_ONLY:'true',COPILOT_AUTO_UPDATE:'false'};
for(const k of ['MERMAIL_API_KEY','MERMAIL_MCP_TEST_API_KEY','PRODUCT_ROOT','DEMO_ROOT','NARRATION_ROOT','PIPER_MODEL'])delete env[k];
const mcpConfig=file('mcp');
fs.writeFileSync(mcpConfig,JSON.stringify({mcpServers:{'mermail-demo':{type:'stdio',command:'node',args:[path.join(harness,'proxy.mjs')],env:{MERMAIL_API_KEY:process.env.MERMAIL_API_KEY,SCOPE_FILE:file('scope'),AUDIT_FILE:auditFile,PACKET_FILE:file('packet'),RECEIPTS_FILE:file('receipts'),PREVIEW_FILE:file('preview'),GATE_FILE:file('gate'),SAVED_FILE:file('saved'),READBACK_FILE:file('readback'),BUILDER_PATH:path.join(product,'skills/mermail-freelance-margin-guard/scripts/build-margin-packet.mjs')},tools:['*']}}}),{mode:0o600});
const common=['--plugin-dir='+plugin,'--add-dir='+plugin,'--output-format=text','--no-color','--no-ask-user','--no-auto-update','--max-ai-credits=30','--no-custom-instructions','--disable-builtin-mcps','--disallow-temp-dir','--additional-mcp-config=@'+mcpConfig,'--allow-tool=read,mermail-demo','--deny-tool=shell,write,url,memory,read('+privateRoot+'/**),read('+harness+'/**),read('+product+'/**),read('+plugin+'/skills/mermail-freelance-margin-guard/scripts/run-live-proof.mjs),read('+plugin+'/skills/mermail-freelance-margin-guard/references/verification.md)','--excluded-tools=task,list_agents,read_agent,write_agent'];
const help=spawnSync('copilot',['--help'],{encoding:'utf8'}).stdout;
for(const flag of ['--no-remote','--no-remote-export'])if(help.includes(flag))common.push(flag);
fs.writeFileSync(path.join(publicRoot,'client-version.txt'),spawnSync('copilot',['--version'],{encoding:'utf8'}).stdout);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const visualFile=path.join(privateRoot,'visual-state.json');
const visualRender=path.join(publicRoot,'visual-render.jsonl');
const preflight=JSON.parse(fs.readFileSync(process.env.PREFLIGHT_FILE,'utf8'));
must(preflight.status==='PASS'&&preflight.productHead===HEAD,'preflight_metadata_mismatch');
const priorSafety=JSON.parse(fs.readFileSync(path.join(harness,'prior-safety-summary.json'),'utf8'));
must(priorSafety.productHead===HEAD&&priorSafety.cases.length===6&&priorSafety.cases.every(c=>c.result==='PASS'),'prior_safety_metadata_mismatch');
let visual={stage:'intro',productHead:HEAD,pluginFiles:manifest.length,clientVersion:'1.0.89',preflight,priorSafetyCases:priorSafety.cases,events:[]};
function updateVisual(patch={}) {
  visual={...visual,...patch,events:readAudit(),observedAt:new Date().toISOString()};
  const safe=scrub(JSON.stringify(visual));
  const tmp=visualFile+'.tmp';
  fs.writeFileSync(tmp,safe,{mode:0o600});fs.renameSync(tmp,visualFile);
  fs.appendFileSync(path.join(publicRoot,'visual-state-history.jsonl'),safe+'\n');
}
function checkRendered(stage,bodyHash,previewDigest) {
  must(fs.existsSync(visualRender),'graphical_preview_not_rendered');
  const rows=fs.readFileSync(visualRender,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
  const row=rows.filter(r=>r.stage===stage).at(-1);
  must(row&&!row.fitErrors.length,'graphical_preview_clipped_or_incomplete');
  must(!bodyHash||row.bodyHash===bodyHash,'graphical_body_not_exact');
  must(!previewDigest||row.previewDigest===previewDigest,'graphical_preview_digest_mismatch');
}
const clips=JSON.parse(fs.readFileSync(path.join(process.env.NARRATION_ROOT,'clips.json'),'utf8'));
const audio=[];let audioEnd=0,start=0,lastAudit=0;
function narrate(key) {
  if(audio.some(c=>c.key===key))return;
  const at=Math.max((Date.now()-start)/1000+.15,audioEnd+.3);
  audio.push({key,at,...clips[key]});audioEnd=at+clips[key].duration;
}
const readAudit=()=>fs.existsSync(auditFile)?fs.readFileSync(auditFile,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];
async function client(args,phase) {
  const raw=fs.createWriteStream(path.join(privateRoot,phase+'-stdout.txt'),{mode:0o600});
  const err=fs.createWriteStream(path.join(privateRoot,phase+'-stderr.txt'),{mode:0o600});
  const child=spawn('copilot',args,{cwd:workspace,env,stdio:['ignore','pipe','pipe']});
  let buffer='';
  child.stdout.on('data',data=>{raw.write(data);buffer+=data.toString();const lines=buffer.split('\n');buffer=lines.pop();for(const line of lines)display(line);});
  child.stderr.on('data',data=>err.write(data));
  const limit=Math.max(1000,159000-(Date.now()-start));
  const timer=setTimeout(()=>child.kill('SIGTERM'),limit);
  const ticker=setInterval(()=>{
    const events=readAudit();
    for(const e of events.slice(lastAudit)) {
      if(e.kind==='live_read'&&e.slot&&e.bodyPresent) {
        const receipts=fs.existsSync(file('receipts'))?JSON.parse(fs.readFileSync(file('receipts'),'utf8')):[];
        const sources=receipts.map(r=>({slot:scope.messages.find(m=>m.id===r.email.id)?.slot,body:bodyText(r.email),scanStatus:r.email.scan_status??null,senderAuthentication:'unknown'}));
        updateVisual({stage:'sources',sources});
        if(e.slot==='request')narrate('sources');
      }
      if(e.kind==='local_builder'&&e.success) {
        updateVisual({stage:'packet',packet:JSON.parse(fs.readFileSync(file('packet'),'utf8'))});
        narrate('packet');
      }
    }
    if(events.length!==lastAudit)updateVisual();
    lastAudit=events.length;
  },100);
  const result=await new Promise(resolve=>{child.once('error',()=>resolve({status:-1,error:'client_spawn_failed'}));child.once('exit',(status,signal)=>resolve({status,signal}));});
  clearInterval(ticker);clearTimeout(timer);if(buffer)display(buffer);raw.end();err.end();
  must(result.status===0,'client_phase_incomplete_'+phase);
  return result;
}
async function preloadDocumentation() {
  const setup='Prepare the installed Mermail plugin for a later owner task. Load the mermail-freelance-margin-guard, mermail-manage-inbox and mermail-compose-email skills. Read Margin Guard references/input-schema.md, tools.md, workflows.md and security.md, and Compose Email references/tools.md and security.md. Read documentation only. Do not read fixtures, evaluator files, run-live-proof.mjs or verification.md. Do not access email or use network tools. There is no project, source data, expected answer or draft to prepare yet. Reply briefly that documentation is ready.';
  const setupArgs=common.filter(a=>!a.startsWith('--additional-mcp-config=')&&!a.startsWith('--allow-tool='));
  setupArgs.push('--allow-tool=read');
  const child=spawn('copilot',['-p',setup,...setupArgs],{cwd:workspace,env,stdio:['ignore','pipe','pipe']});
  const raw=fs.createWriteStream(path.join(privateRoot,'setup-stdout.txt'),{mode:0o600});
  const err=fs.createWriteStream(path.join(privateRoot,'setup-stderr.txt'),{mode:0o600});
  child.stdout.pipe(raw);child.stderr.pipe(err);
  const timer=setTimeout(()=>child.kill('SIGTERM'),150000);
  const code=await new Promise(resolve=>{child.once('error',()=>resolve(-1));child.once('exit',resolve);});
  clearTimeout(timer);must(code===0,'documentation_setup_incomplete');
  must(readAudit().length===0,'setup_must_not_access_mail');
}
let ffmpeg,visualWindow,xvfb,finished=false,status={productHead:HEAD,harnessHead:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,status:'RUNNING',client:'GitHub Copilot CLI 1.0.89',video:'Continuous live graphical evaluation workspace driven by the actual native Copilot client and current-run hosted Mermail events. Not the official Mermail web console.',audio:'Locally generated English Piper narration; no cloned human voice.',authorization:'Owner-delegated operator approval for one exact internal synthetic draft; no human approval click is claimed.'};
try {
  await preloadDocumentation();
  // Preflight is outside the film. Let the free-tier read budget reset before
  // starting the client; never shorten or accelerate the captured workflow.
  await wait(65000);
  fs.writeFileSync(stream,'');
  updateVisual();
  fs.copyFileSync(process.env.PREFLIGHT_FILE,path.join(publicRoot,'preflight.json'));
  fs.writeFileSync(path.join(publicRoot,'prior-safety-summary.json'),JSON.stringify(priorSafety,null,2));
  xvfb=spawn('Xvfb',[':91','-screen','0','1920x1080x24','-nolisten','tcp'],{stdio:'ignore'});
  await wait(600);
  visualWindow=spawn(process.env.UI_PYTHON||'python3',[path.join(harness,'visual_ui.py'),visualFile,visualRender],{env:{...process.env,DISPLAY:':91'},stdio:['ignore','ignore',fs.openSync(path.join(privateRoot,'visual-ui.log'),'w')]});
  await wait(1000);
  must(visualWindow.exitCode===null,'graphical_workspace_failed_to_start');
  checkRendered('intro');
  const rawVideo=path.join(privateRoot,'capture.mp4');
  ffmpeg=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','x11grab','-draw_mouse','0','-framerate','15','-video_size','1920x1080','-i',':91','-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p',rawVideo],{stdio:['pipe','ignore','ignore']});
  start=Date.now();
  display('FREELANCE MARGIN GUARD | Ehsan Benvari\nLIVE COPILOT CLI OUTPUT -- private identifiers redacted\nProduct: '+HEAD+'\nPlugin documentation loaded before capture; no task data or mail was preloaded.\nSynthetic test messages; hypothetical owner estimates; no external sends.\n\nOWNER REQUEST:\n'+prompt,{clear:true});
  narrate('intro');
  await wait(2200);
  const first=await client(['--continue','-p',prompt,...common],'preview');
  const packet=JSON.parse(fs.readFileSync(file('packet'),'utf8'));
  const frozen=JSON.parse(fs.readFileSync(file('preview'),'utf8'));
  must(builder.verifyMarginPacket(packet).valid,'independent_packet_verification_failed');
  const rechecked=freezePreview(frozen.preview.arguments,frozen.preview.packetDigest,scope,packet);
  must(rechecked.previewDigest===frozen.previewDigest,'frozen_preview_changed');
  const before=readAudit();
  must(before.filter(e=>e.kind==='live_read'&&e.slot&&e.bodyPresent).map(e=>e.slot).includes('baseline')&&before.some(e=>e.kind==='live_read'&&e.slot==='request'&&e.bodyPresent),'missing_live_source_reads');
  must(!before.some(e=>['save_attempt','forbidden_write','blocked_save'].includes(e.kind)),'write_before_review');
  checkRendered('sources');
  checkRendered('packet');
  const rev=packet.baseline.revisionBudget;
  must(rev.included===2&&rev.usedBefore===1&&rev.covered===1&&rev.overflow===1&&rev.remainingAfter===0,'revision_accounting_wrong');
  must(Date.now()-start<126000,'insufficient_time_for_safe_save_and_readback');
  display('OPERATOR REVIEW -- EXACT UNSENT DRAFT\nTo / From: the same discovered test mailbox | Cc/Bcc/attachments: none\nSubject: '+SUBJECT+'\nPacket digest: '+packet.integrity.packetDigest+'\nPreview digest: '+frozen.previewDigest+'\n\n'+frozen.preview.arguments.body.body+'\n\nSTATE: awaiting exact internal-draft approval. No write has occurred.',{clear:true});
  updateVisual({stage:'approval',body:frozen.preview.arguments.body.body,previewDigest:frozen.previewDigest});
  narrate('approval');
  await wait(6500);
  checkRendered('approval',hash(frozen.preview.arguments.body.body),frozen.previewDigest);
  const gate={action:'save_draft_only',authorizationSource:'owner_delegated_demo_operator',previewDigest:frozen.previewDigest,packetDigest:frozen.preview.packetDigest,approvedAt:new Date().toISOString(),basis:'User instruction of 6 October: complete priority 1, including an authorized internal test draft. Operator inspected exact displayed preview; all current product/source/recipient/content checks passed. No send, contract, payment, wallet or work authority.'};
  fs.writeFileSync(file('gate'),JSON.stringify(gate),{mode:0o600});
  const approval='Owner-delegated demo operator approval: save exactly the one internal self-addressed synthetic draft frozen under preview SHA-256 '+frozen.previewDigest+' and unchanged packet SHA-256 '+frozen.preview.packetDigest+'. Use the exact native arguments returned by freeze_draft_preview, including its idempotencyKey, once. Then call get_email for the returned draft id with agent_safe_content:true and max_body_chars:10000 to read the complete stored body. Do not send, reply, accept terms, authorize work, use wallets, change the draft or retry a save. State the observed saved-and-read-back result and that the draft remains unsent.';
  display('\nOPERATOR: delegated approval granted for the displayed unchanged internal draft only.\n\nRESUMING THE SAME COPILOT SESSION:\n'+approval);
  const second=await client(['--continue','-p',approval,...common],'save-readback');
  const saved=JSON.parse(fs.readFileSync(file('saved'),'utf8'));
  const readback=JSON.parse(fs.readFileSync(file('readback'),'utf8'));
  const verified=verifyReadback(readback.email,saved.draftId,frozen);
  const events=readAudit();
  must(events.filter(e=>e.kind==='save_attempt').length===1&&events.filter(e=>e.kind==='save_completed').length===1&&events.some(e=>e.kind==='live_draft_readback'&&e.success),'one_save_and_authoritative_readback_required');
  must(!events.some(e=>['forbidden_write','blocked_save'].includes(e.kind)),'unexpected_write_attempt');
  display('OBSERVED MERMAIL RESULT -- CURRENT PRODUCT\nOne internal draft saved; complete body read back from the live server.\nExact body / subject / sender / recipient: MATCH\nCc / Bcc / attachments: NONE | Folder: DRAFTS | Email sends: ZERO\nBody SHA-256: '+verified.bodyHash+'\n\n'+bodyText(readback.email)+'\n\nThree review choices: remove/swap; ordinary-fee extension; proposed paid rush.\nTest estimates only. No accepted agreement, payment or permission to start work.',{clear:true});
  updateVisual({stage:'result',body:bodyText(readback.email),bodyHash:verified.bodyHash});
  narrate('result');
  await wait(800);
  checkRendered('result',verified.bodyHash,frozen.previewDigest);
  status={...status,status:'PASS',first,second,checkedAt:new Date().toISOString(),previewDigest:frozen.previewDigest,packetDigest:packet.integrity.packetDigest,bodyHash:verified.bodyHash,verifiedEmailSources:2,saveAttempts:1,externalSends:0,readbackVerified:true,actualToolEvents:events,margin:packet.marginSnapshot,revision:rev,clientOptions:packet.clientOptions,sourceLimitations:{synthetic:true,selfAddressedSent:true,scanStatus:prepared.messages.map(m=>m.email.scan_status??null),senderAuthentication:'unknown'}};
  fs.writeFileSync(path.join(publicRoot,'draft-body.txt'),scrub(frozen.preview.arguments.body.body)+'\n');
  fs.writeFileSync(path.join(publicRoot,'scope-report.md'),scrub(builder.renderMarkdown(packet)));
  fs.writeFileSync(path.join(publicRoot,'packet-redacted.json'),scrub(JSON.stringify(packet,null,2)));
  const reviewConfig=JSON.parse(fs.readFileSync(path.join(harness,'review-config.json'),'utf8'));
  fs.writeFileSync(path.join(publicRoot,'encrypted-review.json'),JSON.stringify(encryptReview({scope,packet,frozen,gate,saved,readback,clientStdout:{first:fs.readFileSync(path.join(privateRoot,'preview-stdout.txt'),'utf8'),second:fs.readFileSync(path.join(privateRoot,'save-readback-stdout.txt'),'utf8')}},reviewConfig.reviewPublicKey),null,2));
  const resultAudio=audio.find(c=>c.key==='result');
  await wait(Math.max(10000,(resultAudio.at+resultAudio.duration+.5)*1000-(Date.now()-start)));
  updateVisual({stage:'tests'});
  narrate('tests');
  await wait(500);checkRendered('tests');
  const finalSeconds=Math.max(165,audioEnd+2,(Date.now()-start)/1000+8);
  must(finalSeconds<=178,'recording_exceeds_three_minutes');
  await wait(Math.max(0,finalSeconds*1000-(Date.now()-start)));
  finished=true;
} catch(e) {
  status={...status,status:'FAIL',code:/^[a-z_]+$/.test(e.code||e.message)?e.code||e.message:'bounded_workflow_stopped',checkedAt:new Date().toISOString(),actualToolEvents:readAudit(),saveAttempts:readAudit().filter(e=>e.kind==='save_attempt').length};
  display('WORKFLOW STOPPED: '+status.code+'\nNo successful complete demo is claimed.');
  updateVisual({stage:'failed',failure:status.code});
} finally {
  if(ffmpeg&&ffmpeg.exitCode===null){ffmpeg.stdin.end('q');await new Promise(r=>ffmpeg.once('exit',r));}
  visualWindow?.kill();xvfb?.kill();
  status.recordedSeconds=start?(Date.now()-start)/1000:0;
  fs.writeFileSync(path.join(publicRoot,'status.json'),JSON.stringify(status,null,2));
  fs.writeFileSync(path.join(publicRoot,'terminal-transcript.json'),JSON.stringify(transcript,null,2));
  fs.writeFileSync(path.join(publicRoot,'narration-timeline.json'),JSON.stringify(audio.map(({file,...c})=>c),null,2));
  fs.writeFileSync(stream+'.done','done');
}
if(!finished) {process.exitCode=1;console.log('Native live demo stopped safely: '+status.code);}
else {
  const inputs=['-hide_banner','-loglevel','error','-y','-i',path.join(privateRoot,'capture.mp4')];
  audio.forEach(c=>inputs.push('-i',c.file));
  const filter=audio.map((c,i)=>'['+(i+1)+':a]adelay='+Math.round(c.at*1000)+'|'+Math.round(c.at*1000)+',apad=whole_dur='+status.recordedSeconds+'[a'+i+']').join(';')+';'+audio.map((c,i)=>'[a'+i+']').join('')+'amix=inputs='+audio.length+':normalize=0[a]';
  const mux=spawnSync('ffmpeg',[...inputs,'-filter_complex',filter,'-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-ar','44100','-ac','2','-b:a','128k','-t',String(Math.min(status.recordedSeconds,178)),'-movflags','+faststart',path.join(publicRoot,'graphical-current-head-demo.mp4')],{encoding:'utf8'});
  must(mux.status===0,'audio_mux_failed');
  const probe=spawnSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',path.join(publicRoot,'graphical-current-head-demo.mp4')],{encoding:'utf8'});
  const metadata=JSON.parse(probe.stdout);
  must(Number(metadata.format.duration)<=180&&Number(metadata.format.duration)>=120&&metadata.streams.some(s=>s.codec_type==='audio')&&metadata.streams.some(s=>s.codec_type==='video'&&s.codec_name==='h264'),'final_video_contract_failed');
  fs.writeFileSync(path.join(publicRoot,'video-metadata.json'),JSON.stringify(metadata,null,2));
  for(const p of walk(publicRoot).filter(p=>!p.endsWith('.mp4')&&!p.endsWith('encrypted-review.json'))) {
    const text=fs.readFileSync(p,'utf8');
    must(![process.env.MERMAIL_API_KEY,process.env.GITHUB_TOKEN,scope.mailbox.email,scope.mailbox.id,...scope.messages.map(m=>m.id)].filter(Boolean).some(s=>text.includes(s)),'public_private_identifier_leak');
  }
  const files=walk(publicRoot).map(p=>({path:path.relative(publicRoot,p),sha256:hash(fs.readFileSync(p)),bytes:fs.statSync(p).size}));
  fs.writeFileSync(path.join(publicRoot,'SHA256SUMS.json'),JSON.stringify({productHead:HEAD,files},null,2));
  console.log('Current-product native client demo PASS: one exact internal save, authoritative complete readback, zero sends; continuous video '+metadata.format.duration+' seconds with English narration.');
}
