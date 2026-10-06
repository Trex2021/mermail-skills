import json, pathlib, wave
from piper import PiperVoice

root = pathlib.Path(__file__).parent
out = pathlib.Path(__import__('os').environ['NARRATION_ROOT'])
out.mkdir(parents=True, exist_ok=True)
voice = PiperVoice.load(__import__('os').environ['PIPER_MODEL'])
phrases = {
    'intro': 'A client asks for just a few small changes. Freelance Margin Guard shows what those changes really mean. This is a live GitHub Copilot command line session using Mermail, with synthetic emails and hypothetical owner supplied estimates. The product version is pinned and private identifiers are redacted.',
    'sources': 'The agent reads only the two selected Mermail messages: the accepted scope and the later request. A sanitized source read does not prove the identity of a real customer. The original exclusions and acceptance criteria must remain in the decision.',
    'packet': 'The observed packet identifies fifteen to twenty two additional hours. One remaining revision is included, so it is not charged again. The ordinary added fee is three hundred fifty two dollars fifty to five hundred seventeen dollars. The owner supplied ten percent rush rule is separate.',
    'approval': 'Here is the complete draft preview. The agent has stopped before saving. The owner delegated permission for one internal synthetic draft, so the operator now approves this exact frozen payload. Email sends, payment, and permission to start work remain disabled.',
    'result': 'The live Mermail server has saved one internal draft, and the agent has read it back. Its full text and recipients match the approved preview. The client can remove or swap additions, extend the schedule, or review a paid rush change order. These are test estimates, not recovered revenue or an accepted contract.',
}
meta = {}
for key, text in phrases.items():
    name = out / (key + '.wav')
    with wave.open(str(name), 'wb') as f:
        voice.synthesize_wav(text, f)
    with wave.open(str(name), 'rb') as f:
        seconds = f.getnframes() / f.getframerate()
    meta[key] = {'file': str(name), 'duration': seconds, 'text': text}
(out / 'clips.json').write_text(json.dumps(meta, indent=2))
print('English narration prepared locally; no private mailbox text submitted to a speech service.')
