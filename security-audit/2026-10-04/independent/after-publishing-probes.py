import json
import os
import subprocess
import tempfile
from pathlib import Path

base = Path(__file__).resolve().parent
source = base.parent / 'source'
case_root = Path(tempfile.mkdtemp(prefix='after-publishing-cases-', dir=base))
namespace = {'__name__': 'independent_after_import'}
exec(compile((source / 'scripts/clawhub-ci-publish.py').read_text(), str(source / 'scripts/clawhub-ci-publish.py'), 'exec'), namespace)
results = []

def check(name, task):
    try:
        detail = task()
        results.append({'name': name, 'pass': True, 'detail': detail})
    except Exception as error:
        results.append({'name': name, 'pass': False, 'error': str(error)})

def new_workspace(name):
    workspace = case_root / ('after-publish-' + name)
    skill = workspace / 'skills' / 'synthetic'
    skill.mkdir(parents=True, exist_ok=True)
    (skill / 'SKILL.md').write_text('---\nname: synthetic\ndescription: synthetic after validation\n---\n')
    return workspace, skill

outside = case_root / 'after-publish-outside'
outside.mkdir(exist_ok=True)
(outside / 'SKILL.md').write_text('synthetic external skill\n')
(outside / 'SYNTHETIC_SECRET.txt').write_text('synthetic only\n')

def expect_exit(task):
    try:
        task()
    except SystemExit as error:
        return str(error)
    raise AssertionError('expected contained-path/symlink rejection')

def regular():
    workspace, skill = new_workspace('regular')
    targets = namespace['discover_targets'](workspace, 'skills', '')
    assert targets == [skill.resolve()]
    assert list(namespace['local_file_hashes'](skill)) == ['SKILL.md']
check('ordinary Python skill discovery and hashing remains supported', regular)

def directory_link():
    workspace, skill = new_workspace('directory-link')
    (workspace / 'skills' / 'outside-link').symlink_to(outside, target_is_directory=True)
    return expect_exit(lambda: namespace['discover_targets'](workspace, 'skills', ''))
check('Python rejects discovered directory symlink escape', directory_link)

def file_link():
    workspace, skill = new_workspace('file-link')
    (skill / 'linked-secret.txt').symlink_to(outside / 'SYNTHETIC_SECRET.txt')
    return expect_exit(lambda: namespace['discover_targets'](workspace, 'skills', ''))
check('Python rejects nested file symlink escape before discovery', file_link)

def broken_link():
    workspace, skill = new_workspace('broken-link')
    (skill / 'broken').symlink_to(outside / 'does-not-exist')
    return expect_exit(lambda: namespace['local_file_hashes'](skill))
check('Python direct hashing rejects broken symlink', broken_link)

def explicit_escape():
    workspace, skill = new_workspace('explicit-escape')
    return expect_exit(lambda: namespace['discover_targets'](workspace, 'skills', str(outside)))
check('Python explicit absolute target outside workspace rejected', explicit_escape)

def internal_link():
    workspace, skill = new_workspace('internal-link')
    (workspace / 'alias').symlink_to(skill, target_is_directory=True)
    return expect_exit(lambda: namespace['discover_targets'](workspace, 'skills', 'alias'))
check('Python explicit internal symlink is also rejected', internal_link)

bin_dir = base / 'after-mock-bin'
bin_dir.mkdir(exist_ok=True)
mock_cli = bin_dir / 'clawhub'
mock_cli.write_text('#!/usr/bin/env python3\nimport json, os, sys\nwith open(os.environ["SYNTHETIC_PUBLISH_LOG"], "a") as f:\n    f.write(json.dumps(sys.argv[1:]) + "\\n")\n')
mock_cli.chmod(0o755)

def shell_run(flag, script=source / 'scripts/publish-clawhub.sh', suffix='source'):
    log = base / ('after-publish-calls-' + str(flag).replace(' ', '_') + '-' + suffix + '.jsonl')
    log.write_text('')
    env = {'PATH': str(bin_dir) + ':/usr/local/bin:/usr/bin:/bin', 'CLAWHUB_VERSION': 'synthetic', 'CLAWHUB_OWNER': 'synthetic', 'SYNTHETIC_PUBLISH_LOG': str(log)}
    if flag is not None:
        env['CLAWHUB_LIVE'] = flag
    completed = subprocess.run(['/bin/bash', str(script)], env=env, text=True, capture_output=True, timeout=10)
    calls = [json.loads(line) for line in log.read_text().splitlines()]
    return completed, calls

for flag in [None, '0', 'false', 'no']:
    def dry(flag=flag):
        completed, calls = shell_run(flag)
        assert completed.returncode == 0, completed.stderr
        assert len(calls) == 18
        assert all('--dry-run' in call for call in calls)
        return {'calls': len(calls), 'allDryRun': True}
    check('Shell preserves dry run for flag ' + str(flag), dry)

for flag in ['yes', 'TRUE', ' 1', 'bad']:
    def invalid(flag=flag):
        completed, calls = shell_run(flag)
        assert completed.returncode != 0
        assert calls == []
    check('Shell invalid flag rejects before CLI: ' + flag, invalid)

def opt_in():
    completed, calls = shell_run('1')
    assert completed.returncode == 0, completed.stderr
    assert len(calls) == 18
    assert all('--dry-run' not in call for call in calls)
    return {'calls': len(calls), 'localMockOnly': True}
check('Shell exact flag 1 activates only the fake publisher', opt_in)

def shell_symlink():
    workspace, skill = new_workspace('shell-link')
    scripts = workspace / 'scripts'
    scripts.mkdir(exist_ok=True)
    copied = scripts / 'publish-clawhub.sh'
    copied.write_bytes((source / 'scripts/publish-clawhub.sh').read_bytes())
    (skill / 'linked-secret').symlink_to(outside / 'SYNTHETIC_SECRET.txt')
    completed, calls = shell_run('1', copied, 'symlink')
    assert completed.returncode != 0
    assert calls == []
    return {'noPublisherCalls': True}
check('Shell rejects nested symlink before any fake publish', shell_symlink)

output = {'passes': sum(result['pass'] for result in results), 'failures': sum(not result['pass'] for result in results), 'results': results}
(base / 'after-publishing-results.json').write_text(json.dumps(output, indent=2) + '\n')
for result in results:
    print(('PASS ' if result['pass'] else 'FAIL ') + result['name'] + (': ' + result['error'] if 'error' in result else ''))
raise SystemExit(1 if output['failures'] else 0)
