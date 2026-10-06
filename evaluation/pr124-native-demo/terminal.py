import os, pathlib, sys, time

stream = pathlib.Path(os.environ['TERMINAL_STREAM'])
print('\033[2J\033[H', end='', flush=True)
while not stream.exists():
    time.sleep(.05)
with stream.open() as f:
    while True:
        text = f.read()
        if text:
            sys.stdout.write(text)
            sys.stdout.flush()
        if pathlib.Path(str(stream) + '.done').exists():
            time.sleep(.3)
        time.sleep(.04)
