import json, os, pathlib, wave
from piper import PiperVoice

out=pathlib.Path(os.environ['NARRATION_ROOT'])
out.mkdir(parents=True,exist_ok=True)
voice=PiperVoice.load(os.environ['PIPER_MODEL'])
phrases={
 'intro': 'A few small changes can quietly turn a landing page into a much larger project. Freelance Margin Guard makes that difference visible. This graphical evaluation workspace follows an actual Copilot agent using the submitted plugin and hosted Mermail. The inputs and estimates are synthetic. The product version is pinned.',
 'sources': 'The agent reads only two selected messages: the accepted scope and the later request. The agreement includes a responsive landing page and two revision rounds. Dashboard, payments and login were excluded. One revision was already used. The original acceptance criteria remain intact.',
 'packet': 'The current product links each change to its source. Fifteen to twenty two additional hours means three hundred fifty two dollars fifty to five hundred seventeen dollars at the owner supplied test rate. The included revision is never charged twice. Three options preserve the original scope, extend the schedule, or discuss a paid rush.',
 'approval': 'Before any save, the agent stops at the complete frozen preview. No write has occurred. The operator checks this exact payload under the owner delegated permission for one internal synthetic draft. Permission to send email, accept an agreement, pay, or start work is still absent.',
 'result': 'The live Mermail server saved one internal draft. Its complete body, subject and addresses were read back and matched the approved preview. The draft remains unsent. The dates, ordinary fee and rush estimate are visible here. These are discussion options, not recovered revenue or an accepted contract.',
 'tests': 'This run also passed the exact product suites, fourteen save and readback guards, and authenticated production tool discovery. Six separate safety sessions from October fifth tested unrelated, old and consumed receipts, missing and hostile rates, and funding without action authority. The linked evidence retains the measured boundaries. Human review is still pending.',
}
meta={}
for key,text in phrases.items():
 path=out/(key+'.wav')
 with wave.open(str(path),'wb') as f:voice.synthesize_wav(text,f)
 with wave.open(str(path),'rb') as f:seconds=f.getnframes()/f.getframerate()
 meta[key]={'file':str(path),'duration':seconds,'text':text}
(out/'clips.json').write_text(json.dumps(meta,indent=2))
print('English narration generated locally from public script; no mailbox content sent to a speech service.')
