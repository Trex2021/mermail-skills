import fs from 'node:fs';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
const wait = ms => new Promise(r=>setTimeout(r,ms));
const assert = (ok,message)=>{if(!ok) throw new Error(message);};
export async function startCapture({publicRoot,harness,head,prompt,prior}) {
  const temp=path.dirname(publicRoot), stateFile=path.join(temp,'demo-state.json'), eventFile=path.join(temp,'demo-events.jsonl');
  const recording=path.join(publicRoot,'continuous-current-head-demo.mp4');
  const state={head,prompt,prior,phase:'live',runId:process.env.GITHUB_RUN_ID};
  fs.writeFileSync(stateFile,JSON.stringify(state),{mode:0o600});
  fs.writeFileSync(eventFile,'',{mode:0o600});
  const env={...process.env,DISPLAY:':99'};
  const xvfb=spawn('Xvfb',[':99','-screen','0','1280x720x24','-nolisten','tcp'],{stdio:'ignore'});
  let gui,ffmpeg,transcriptTimer;
  const stop=async()=>{
    clearInterval(transcriptTimer);
    if(ffmpeg&&ffmpeg.exitCode===null){const finished=new Promise(r=>ffmpeg.once('exit',r));ffmpeg.kill('SIGINT');await Promise.race([finished,wait(6000)]);}
    if(gui) gui.kill('SIGTERM');xvfb.kill('SIGTERM');
  };
  try {
    for(let n=0;n<40&&!fs.existsSync('/tmp/.X11-unix/X99');n++) await wait(100);
    assert(fs.existsSync('/tmp/.X11-unix/X99'),'recording_display_unavailable');
    gui=spawn('python3',[path.join(harness,'demo-ui.py'),stateFile,eventFile],{env,stdio:['ignore','ignore',fs.openSync(path.join(temp,'demo-ui.log'),'w')]});
    await wait(1500);assert(gui.exitCode===null,'recording_ui_failed');
    ffmpeg=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','x11grab','-draw_mouse','0','-framerate','15','-video_size','1280x720','-i',':99.0','-an','-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',recording],{stdio:['ignore','ignore',fs.openSync(path.join(temp,'demo-ffmpeg.log'),'w')]});
    const started=Date.now();await wait(800);assert(ffmpeg.exitCode===null,'recording_encoder_failed');
    return {eventFile,
      observe(file){let loaded=false;transcriptTimer=setInterval(()=>{if(loaded||!fs.existsSync(file))return;for(const line of fs.readFileSync(file,'utf8').split('\n')){let e;try{e=JSON.parse(line);}catch{continue;}if(e.type==='tool.execution_start'&&/mermail-freelance-margin-guard/.test(JSON.stringify(e.data||{}))){fs.appendFileSync(eventFile,JSON.stringify({at:new Date().toISOString(),kind:'skill_loaded',tool:'mermail-freelance-margin-guard'})+'\n');loaded=true;break;}}},400);},
      async finish({result,failures,packet,sanitizedAnswer,prior,writes}) {
        clearInterval(transcriptTimer);
        const safeRange=r=>r&&Number.isFinite(r.min)&&Number.isFinite(r.max)?{min:r.min,max:r.max}:null;
        const summary={result,failures,productHead:head,githubRunId:process.env.GITHUB_RUN_ID,skill:result==='PASS'?'mermail-freelance-margin-guard':null,classification:packet?.state,addedHours:safeRange(packet?.marginSnapshot?.knownAddedHours),baseFee:safeRange(packet?.marginSnapshot?.completeBaseFeeRange),rushFee:safeRange(packet?.marginSnapshot?.completeTotalFeeRange),currency:packet?.baseline?.pricing?.currency,ownerRate:packet?.baseline?.pricing?.rate?.amount,rushPercent:packet?.baseline?.pricing?.rushPremium?.percent,options:result==='PASS'?(packet?.clientOptions||[]).map(o=>({id:o.id,feeRange:safeRange(o.feeRange),deadline:o.deadline,deadlineRange:o.deadlineRange})):[],prior,attemptedWrites:writes,externalWritesForwarded:0,sourceBodyPublished:false};
        fs.writeFileSync(path.join(publicRoot,'demo-summary.json'),JSON.stringify(summary,null,2));
        fs.writeFileSync(stateFile,JSON.stringify({...state,phase:result==='PASS'?'verified':'failed',summary}),{mode:0o600});
        const elapsed=Date.now()-started;
        await wait(Math.max(7000,125000-elapsed));
        await stop();
        const probe=spawnSync('ffprobe',['-v','error','-show_entries','format=duration,size','-show_entries','stream=codec_name,width,height','-of','json',recording],{encoding:'utf8'});
        assert(probe.status===0,'recording_probe_failed');const metadata=JSON.parse(probe.stdout);
        const duration=Number(metadata.format.duration);
        assert(duration>=120&&duration<=180,'recording_outside_two_to_three_minutes');
        metadata.productHead=head;metadata.githubRunId=process.env.GITHUB_RUN_ID;metadata.oneTake=true;metadata.successfulSession=result==='PASS';
        fs.writeFileSync(path.join(publicRoot,'video-metadata.json'),JSON.stringify(metadata,null,2));
        console.log('Continuous current-head recording: '+duration.toFixed(2)+' seconds; '+result+'.');
      }};
  } catch(e) {await stop();throw e;}
}
