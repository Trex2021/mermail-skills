const PRODUCT='c4876e43189c41771fcfa89f30d6cab400257654';
const INDEX_SHA256='b0441f637f10eb51742d0de95ac077296dc9e89d8eb3fcc9f3b3ce37c29df07a';
const ASSETS=['status.json','source-ledger.json','draft-body.txt','scope-report.md'];
const hash=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
const close=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<0.000001;
let cached=null;
async function load(){
  const names=['SHA256SUMS.json',...ASSETS];
  const pairs=await Promise.all(names.map(async name=>{
    const response=await fetch('./current-output/'+name,{cache:'no-store'});
    if(!response.ok)throw new Error('The published evidence file could not be loaded.');
    const bytes=await response.arrayBuffer();return{name,bytes,text:new TextDecoder().decode(bytes)};
  }));
  const files=Object.fromEntries(pairs.map(x=>[x.name,x]));
  cached={files,index:JSON.parse(files['SHA256SUMS.json'].text),status:JSON.parse(files['status.json'].text),ledger:JSON.parse(files['source-ledger.json'].text)};
  return cached;
}
async function verify(tamper=false){
  const label=document.getElementById('current-result-status'),list=document.getElementById('current-result-checks');
  label.textContent='Checking published current-product evidence…';list.replaceChildren();
  try{
    const data=cached??await load(),s=structuredClone(data.status);
    if(tamper)s.margin.completeBaseFeeRange.min+=100;
    const m=s.margin,r=s.revision,checks=[];
    checks.push(['Pinned index and four original published file hashes',await hash(data.files['SHA256SUMS.json'].bytes)===INDEX_SHA256 && (await Promise.all(ASSETS.map(async name=>await hash(data.files[name].bytes)===data.index[name]))).every(Boolean)]);
    checks.push(['Exact current product and successful run',s.productHead===PRODUCT && s.runId==='37401281664' && s.readbackVerified===true]);
    checks.push(['Two selected synthetic source records',s.verifiedEmailSources===2 && data.ledger.length===2 && ['baseline','request'].every(slot=>data.ledger.filter(x=>x.slot===slot).length===1) && s.sourceNotes.syntheticSelfAddressed===true]);
    checks.push(['Complete observed draft body hash',await hash(data.files['draft-body.txt'].bytes)===s.bodySha256]);
    checks.push(['Owner rate, labor and rush arithmetic',close(m.completeBaseFeeRange.min,m.knownAddedHours.min*m.effectiveHourlyRate) && close(m.completeBaseFeeRange.max,m.knownAddedHours.max*m.effectiveHourlyRate) && close(m.rushPremiumAmountRange.min,m.completeBaseFeeRange.min*m.rushPremium.percent/100) && close(m.rushPremiumAmountRange.max,m.completeBaseFeeRange.max*m.rushPremium.percent/100) && close(m.completeTotalFeeRange.min,m.completeBaseFeeRange.min+m.rushPremiumAmountRange.min) && close(m.completeTotalFeeRange.max,m.completeBaseFeeRange.max+m.rushPremiumAmountRange.max)]);
    checks.push(['Only overflow revisions are added work',r.included===2 && r.usedBefore===1 && r.requested===2 && r.covered===1 && r.overflow===1 && r.remainingAfter===0]);
    const allowed=new Set(['initialize','tools/list','list_mailboxes','search_emails','get_email_context','get_email']);
    checks.push(['Three options, zero writes and zero sends',s.options.length===3 && new Set(s.options.map(x=>x.id)).size===3 && s.saveAttempts===0 && s.externalSends===0 && s.audit.every(x=>x.success===true && x.writeAttempt===false && allowed.has(x.tool))]);
    for(const[name,pass]of checks){const li=document.createElement('li');li.textContent=(pass?'PASS — ':'FAIL — ')+name;li.style.color=pass?'var(--green)':'var(--danger)';list.append(li);}
    document.getElementById('current-draft-body').textContent=data.files['draft-body.txt'].text;
    const passed=checks.filter(x=>x[1]).length;
    label.textContent=tamper?(passed<checks.length?'Altered fee rejected — the simulated $100 edit fails commercial arithmetic.':'Unexpected result: the simulated edit was not rejected.'):(passed===checks.length?'7/7 published current-result checks pass.':'Current evidence verification failed; inspect the original run before relying on it.');
    label.style.color=(tamper?passed<checks.length:passed===checks.length)?'var(--green)':'var(--danger)';
  }catch(error){label.textContent='Verification unavailable: '+error.message;label.style.color='var(--danger)';}
}
document.getElementById('verify-current-result').addEventListener('click',()=>verify(false));
document.getElementById('tamper-current-result').addEventListener('click',()=>verify(true));
