import json, hashlib, re, html
from pathlib import Path
from html.parser import HTMLParser

p = Path('observed/graphical-published')
status = json.loads((p/'status.json').read_text())
preflight = json.loads((p/'preflight.json').read_text())
metadata = json.loads((p/'video-metadata.json').read_text())
timeline = json.loads((p/'narration-timeline.json').read_text())
body = (p/'draft-body.txt').read_text().rstrip('\n')
assert hashlib.sha256(body.encode()).hexdigest() == status['bodyHash']
assert status['status'] == 'PASS' and status['saveAttempts'] == 1
assert status['externalSends'] == 0 and status['readbackVerified']
assert preflight['productChecks'] == 198 and preflight['guardChecks'] == 14
assert preflight['catalogTools'] == 83
seconds = float(metadata['format']['duration'])
assert 120 <= seconds < 180
run = status['runId']; harness = status['harnessHead']; product = status['productHead']
video_digest = hashlib.sha256((p/'graphical-current-head-demo.mp4').read_bytes()).hexdigest()

def stamp(n, comma=False):
    ms = round(n*1000); h=ms//3600000; m=(ms//60000)%60; s=(ms//1000)%60
    return f'{h:02}:{m:02}:{s:02}{"," if comma else "."}{ms%1000:03}'

cues = []
for clip in timeline:
    words=clip['text'].split(); groups=[words[i:i+8] for i in range(0,len(words),8)]
    cursor=clip['at']
    for group in groups:
        end=cursor+clip['duration']*len(group)/len(words)
        cues.append((cursor,end,' '.join(group))); cursor=end
(p/'narration-en.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(f'{stamp(a)} --> {stamp(b)}\n{t}' for a,b,t in cues)+'\n')
(p/'narration-en.srt').write_text('\n\n'.join(f'{i}\n{stamp(a,True)} --> {stamp(b,True)}\n{t}' for i,(a,b,t) in enumerate(cues,1))+'\n')

events='\n'.join(f"| `{e['tool']}` — {e.get('slot',e['kind'])} | {e['at'][11:23]} | {'hosted Mermail' if e.get('forwarded') else 'local builder / approval adapter'} |" for e in status['actualToolEvents'])
report=f'''# Graphical continuous live demo — 6 October 2026

**Observed result:** a **2:45 English-narrated, continuous graphical recording** driven by the actual GitHub Copilot CLI 1.0.89 and current-run hosted Mermail events. Selected source emails, workspace files, source-linked scope calculations, complete frozen draft and full server readback are readable in a light evaluation interface. **One internal synthetic draft saved; zero external sends.** This interface is an **evaluation workspace, not the official Mermail web console**.

- Product: [`{product[:7]}`](https://github.com/Trex2021/mermail-skills/commit/{product}) — unchanged from PR #124.
- Isolated graphical harness: [`{harness[:7]}`](https://github.com/Trex2021/mermail-skills/tree/{harness}/evaluation/pr124-native-demo).
- Successful [workflow run {run}](https://github.com/Trex2021/mermail-skills/actions/runs/{run}); final live verification **{status['checkedAt']}**.
- **198 exact-product checks, 14 native save/readback guard checks and authenticated 83-tool discovery passed.** These checks do not constitute independent human review.
- Original recording: **{seconds:.6f} seconds**, 1920 × 1080, H.264, 15 fps, AAC-LC 44.1 kHz stereo. No cuts, speed changes or reconstructed after-the-fact screen sequence. English narration uses a locally generated Piper voice, not a cloned human voice.

## Three-minute review route

1. Watch `graphical-current-head-demo.mp4`: workspace → two selected sources → scope/hour graph and three options → exact pre-save stop → real internal draft save and complete server readback → clearly dated verification evidence.
2. Inspect `scope-report.md`, `packet-redacted.json`, `draft-body.txt` and `status.json`. Each addition remains linked to the source request; original exclusions and desktop/tablet/mobile acceptance criteria remain intact. The included revision is not charged twice.
3. Check the **17 original file hashes** in `SHA256SUMS.json`. `encrypted-review.json` retains raw selected-source receipts, private original identifiers, frozen arguments and server readback for owner-controlled review. Public redaction cannot authenticate those private identities on its own.

| Actual tool event | UTC | Execution |
| --- | --- | --- |
{events}

## Visible commercial result — hypothetical live scenario B

**15–22 additional hours** at the owner-supplied hypothetical **USD 23.50/hour** produces **USD 352.50–517.00** ordinary fee and **USD 387.75–568.70** including the separately supplied 10% rush rule. The dashboard, Stripe, login and one overflow revision carry effort; the five-day earlier deadline itself adds zero labor. The two-day client-owned staging delay stays separately attributed.

The saved draft preserves three discussion choices: remove or confirm an effort-equivalent swap; keep additions at ordinary rates and extend to **24–25 October 2026**; or discuss a paid rush toward **15 October**. No option is accepted, no work is authorized and feasibility is not guaranteed. These are synthetic estimates, not recovered revenue. The separate offline benchmark A (26–33 hours; USD 390–495 at USD 15/hour) uses different inputs.

## Approval, provenance and claim boundaries

- Before capture, the client loaded **plugin documentation only**. No task data or source emails were preloaded. This continues a documentation-prepared native session; it is **not a cold-start skill-selection benchmark**. The separate [five fresh behavior sessions](https://github.com/Trex2021/mermail-skills/blob/23167f2e9b4ae86e10d3e83fc9775b9e176b5ba7/evaluation/pr124-behavior/REPORT.md) cover selection, adjacent routing, successful path, approval stop and hostile source handling.
- The actual client reads two owner-selected, pre-existing **self-addressed synthetic Sent messages**. Null scan state and unknown sender authentication are visibly disclosed. Source correspondence is bounded; authenticated real-customer identity is not claimed.
- The workspace is generated from **current-run live events and real verified payloads**, rather than illustrative result cards. The local `build_margin_packet` calls the shipped product builder; `freeze_draft_preview` is an approval adapter. Neither is represented as a new production Mermail tool.
- The complete frozen body is displayed and checked for clipping and digest correspondence before permission is granted. The operator acts under the owner's **delegated permission for one exact internal synthetic draft**; no fresh human click is claimed. The server readback is independently compared against the unchanged subject, sender, recipient, entire body, empty Cc/Bcc/attachments and unsent Drafts state. Changed, missing, stale or reused approvals cannot grant another save.
- The final verification screen distinguishes this run's 198/14/83 preflight from the **six separate live safety sessions of 5 October**. [Their report](https://github.com/Trex2021/mermail-skills/blob/780bba180c652c2c16749a9975f2e26598ec78c8/evaluation/pr124-security/REPORT.md) covers unrelated, old and consumed receipts, missing/hostile rates, and funding without send/work authority. Those cases are not claimed to have all occurred inside this success-path film.
- Product files and approval guards remain unchanged. Full video decoding, original file hashes, displayed complete-body correspondence and sampled real captured frames were checked after artifact download. Subtitles reproduce narration with approximate within-clip timing; they do not modify the original MP4.
- No private HSE files or information are used. No external message, contract, wallet connection, transfer or financial action occurred.

## Retained attempts and limitations

The first [graphical run 37499732306](https://github.com/Trex2021/mermail-skills/actions/runs/37499732306) functionally passed save/readback, but its chart labels overlapped the bars when the agent used longer ledger identifiers. It was **rejected for publication**. This run corrects the graphical label column and uses semantic labels from the actual ledger; the proxy and approval guards were not weakened.

The earlier [2:02 native CLI film](https://x.com/Ehsan_Benvari/status/2107510447003824637) remains supplementary evidence with its [own report and preserved attempts](https://github.com/Trex2021/mermail-skills/blob/af173585022eeea7270ca4be95fe737363736e27/evaluation/pr124-native-demo/evidence/20261006/REPORT.md). Each run's one-save count refers to that run, not all attempts combined. The native transcript preserves search/schema recoveries; no perfect first-call behavior is claimed.

Independent human review, upstream maintainer workflow approval and merge remain external gates. This demonstration establishes the stated measured path; it does not prove that every arbitrary email or Mermail operation is secure.

| Item | SHA-256 |
| --- | --- |
| Exact frozen preview | `{status['previewDigest']}` |
| Verified packet | `{status['packetDigest']}` |
| Exact retrieved server body | `{status['bodyHash']}` |
| Original continuous MP4 | `{video_digest}` |

`draft-body.txt` has a final newline; its file hash differs from the exact in-server body hash above.

## Complete observed unsent draft

```text
{body}
```
'''
events = json.loads((p/'terminal-transcript.json').read_text())
owner = events[0]['text'].replace('\\n','\n').split('OWNER REQUEST:\n',1)[1]
operator = next(x['text'].replace('\\n','\n') for x in events if 'RESUMING THE SAME COPILOT SESSION:' in x['text']).split('RESUMING THE SAME COPILOT SESSION:\n',1)[1]
prompts = '# Exact rendered prompts — run '+run+'\n\nThese prompts are extracted from the indexed public native transcript. The graphical film displays a concise summary; source subject labels are synthetic. Owner-delegated operator approval is not a fresh human click.\n\n## Owner request before any task tools\n\n```text\n'+owner+'\n```\n\n## Operator continuation after exact preview review\n\n```text\n'+operator+'\n```\n'
(p/'prompts.md').write_text(prompts)
report = report.replace('## Three-minute review route\n','## Full prompts\n\n[Exact owner request and operator continuation](./prompts.md) are extracted from `terminal-transcript.json`. The original complete public transcript is included in the 17-file index. The graphical introduction is a concise display of the owner request.\n\n## Three-minute review route\n')
(p/'REPORT.md').write_text(report)
context = json.loads((p/'publication-context.json').read_text()) if (p/'publication-context.json').exists() else {}
context.update({'runId':run,'productHead':product,'harnessHead':harness,'videoDigest':video_digest,'durationSeconds':seconds,'originalIndexCount':17,'replacesPrimaryPresentation':True,'preservesPriorEvidence':True})
(p/'publication-context.json').write_text(json.dumps(context,indent=2)+'\n')
print(json.dumps({'run':run,'seconds':seconds,'reportChars':len(report),'bodyHash':status['bodyHash'],'subtitleCues':len(cues),'videoDigest':video_digest}))
