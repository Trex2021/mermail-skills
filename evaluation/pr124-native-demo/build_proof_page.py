from pathlib import Path
import json, html, re
from html.parser import HTMLParser

p=Path('observed/graphical-published')
c=json.loads((p/'publication-context.json').read_text())
assert c.get('xURL'), 'Verify publication before generating page'
s=Path('current-output/judge-page-native.html').read_text()
start=s.index('      <section id="live-demo"')
end=s.index('      <section id="native-result"',start)
report=html.escape(c['reportURL'],quote=True); xurl=html.escape(c['xURL'],quote=True)
body=html.escape((p/'draft-body.txt').read_text())
block=f'''      <section id="live-demo" aria-labelledby="live-demo-title">
        <div class="section-head">
          <div><p class="section-kicker">6 October · current c4876e4 · continuous graphical capture</p><h2 id="live-demo-title">Selected emails. Visible scope. One exact saved draft.</h2></div>
          <p class="section-note">2:45, English narration, light graphical workspace. This evaluation interface follows actual Copilot CLI 1.0.89 and current-run Mermail events; it is not the official Mermail web console. No cuts or speed changes. Plugin documentation was prepared before capture; no task data or source mail was preloaded. Developed with Codex.</p>
        </div>
        <video id="graphical-live-video" controls preload="metadata" playsinline style="width:100%;height:auto;border-radius:16px;background:#edf4fa" src="./demo/graphical-current-head-20261006.mp4" poster="./demo/graphical-current-head-20261006.png" aria-label="Continuous graphical current-product Mermail live demo"><track kind="captions" label="English narration" srclang="en" src="./graphical-output/narration-en.vtt"></video>
        <p class="section-note"><strong>Watch the real path:</strong> selected source messages → source-linked hour and fee graph → three discussion choices → complete frozen preview → one live internal save → complete server readback. <a href="{xurl}" target="_blank" rel="noreferrer">Primary graphical demo on X ↗</a> · <a href="{report}">Prompts, actual events, attempt history and boundaries ↗</a>. Sources and estimates are synthetic; no external send, payment, accepted contract or work authorization.</p>
      </section>

      <section id="graphical-result" aria-labelledby="graphical-result-title">
        <div class="section-head">
          <div><p class="section-kicker">This film's actual output · run {c['runId']}</p><h2 id="graphical-result-title">The complete saved result is observable.</h2></div>
          <p class="section-note">The whole retrieved body, subject, addresses, empty Cc/Bcc/attachments and unsent Drafts state match the exact frozen preview. Owner-delegated operator approval covers this one internal synthetic draft; no fresh human click or send permission is claimed.</p>
        </div>
        <div class="option-grid">
          <article class="option-card"><p class="section-kicker">Added effort</p><h3>15–22 hours</h3><p>Dashboard 7–9 h; Stripe 3–5 h; login 2–4 h; one overflow revision 3–4 h. Earlier delivery adds zero labor. One included revision remains included.</p></article>
          <article class="option-card"><p class="section-kicker">Hypothetical owner terms</p><h3>$352.50–$517.00</h3><p>USD 23.50/hour. The separately supplied 10% rush rule produces $387.75–$568.70. These are test estimates, not recovered revenue or a guaranteed delivery promise.</p></article>
          <article class="option-card featured"><p class="section-kicker">Measured result</p><h3>1 save · 0 sends</h3><p>Complete byte-for-byte live body match. This run also passed 198 product checks, 14 save/readback guards and authenticated discovery of 83 production tools.</p></article>
        </div>
        <p class="section-note"><a href="{report}">Full graphical report ↗</a> · <a href="https://github.com/Trex2021/mermail-skills/actions/runs/{c['runId']}">Successful live run ↗</a> · <a href="./graphical-output/status.json">Actual tool timeline</a> · <a href="./graphical-output/scope-report.md">Source-linked report</a> · <a href="./graphical-output/packet-redacted.json">Verified public packet</a> · <a href="./graphical-output/SHA256SUMS.json">17 original file hashes</a> · <a href="./graphical-output/narration-en.srt">English subtitles</a>.</p>
        <details style="padding:24px;border:1px solid var(--line);border-radius:16px"><summary>Read this film's complete observed unsent draft</summary><pre id="graphical-draft-body" style="white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.65 var(--sans);color:var(--ink)">{body}</pre></details>
        <p class="section-note">The two selected messages are pre-existing self-addressed synthetic Sent sources: scan status null, sender authentication unknown. The separate <a href="https://github.com/Trex2021/mermail-skills/blob/23167f2e9b4ae86e10d3e83fc9775b9e176b5ba7/evaluation/pr124-behavior/REPORT.md">five fresh behavior sessions</a> and <a href="https://github.com/Trex2021/mermail-skills/blob/780bba180c652c2c16749a9975f2e26598ec78c8/evaluation/pr124-security/REPORT.md">six live safety sessions of 5 October</a> retain their own dates and purposes. Human review and upstream workflow approval remain pending.</p>
      </section>

'''
s=s[:start]+block+s[end:]
s=s.replace('Watch current 2:02 native demo ↓','Watch the 2:45 graphical demo ↓')
s=s.replace('href="#current-output">Inspect the saved result','href="#graphical-result">Inspect the saved result')
s=s.replace('Start with the native agent demo:','Start with the graphical live agent demo:')
s=s.replace('6 October · current c4876e4 · native agent result','Supplementary native CLI capture · separate earlier 6 October run')
s=s.replace('<h2 id="native-result-title">Saved once, read back completely, left unsent.</h2>','<h2 id="native-result-title">Native CLI evidence is retained alongside the graphical film.</h2>')
pos=s.index('        <div class="option-grid">',s.index('<section id="native-result"'))
native='''        <video controls preload="none" playsinline style="width:100%;height:auto;border-radius:16px;background:#071523" src="./demo/native-current-head-20261006.mp4" poster="./demo/native-current-head-20261006.jpg" aria-label="Supplementary native CLI continuous demo"><track kind="captions" label="English narration" srclang="en" src="./native-output/narration-en.vtt"></video>
        <p class="section-note">Separate 2:02 native CLI recording, with its own packet, draft and one-save count. <a href="https://x.com/Ehsan_Benvari/status/2107510447003824637">Earlier native demo on X ↗</a>. Kept as supplementary evidence; the graphical recording above is the primary presentation.</p>
'''
s=s[:pos]+native+s[pos:]
s=s.replace('<a href="#native-result">native current-product save and full live readback</a>','<a href="#graphical-result">graphical live save and full readback</a> with <a href="#native-result">supplementary native CLI evidence</a>')
class Checker(HTMLParser):
    def __init__(self): super().__init__();self.ids=[];self.hrefs=[]
    def handle_starttag(self,t,a):
        a=dict(a)
        if 'id' in a:self.ids.append(a['id'])
        if a.get('href','').startswith('#'):self.hrefs.append(a['href'][1:])
h=Checker();h.feed(s)
assert len(h.ids)==len(set(h.ids)), 'Duplicate IDs'
assert not set(h.hrefs)-set(h.ids), 'Missing internal anchors'
assert s.count('id="current-draft-body"')==1
assert body in s and '17 original file hashes' in s
Path('current-output/judge-page-graphical.html').write_text(s)
print(json.dumps({'bytes':len(s.encode()),'ids':len(h.ids),'missingAnchors':[],'primaryVideo':c['xURL']}))
