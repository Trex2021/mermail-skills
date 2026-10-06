import json, os, re, sys
from pathlib import Path

product,guards,remote,output=map(Path,sys.argv[1:5])
p,g,r=product.read_text(),guards.read_text(),remote.read_text()
def count(pattern,text):
 values=re.findall(pattern,text)
 if len(values)!=1:raise RuntimeError('ambiguous_or_missing_check_count')
 return int(values[0])
total=count(r'Validated (\d+) Freelance Margin Guard checks',p)+count(r'Validated (\d+) Funding Gate checks',p)+count(r'# tests (\d+)',p)+count(r'Ran (\d+) tests',p)
if count(r'# fail (\d+)',p)!=0 or count(r'# fail (\d+)',g)!=0:raise RuntimeError('failed_preflight_check')
result={'productHead':'c4876e43189c41771fcfa89f30d6cab400257654','productChecks':total,'guardChecks':count(r'# tests (\d+)',g),'catalogTools':count(r'Authenticated Mermail proof passed: initialize; (\d+)-tool catalog',r),'status':'PASS','runId':os.environ['GITHUB_RUN_ID']}
if total!=198 or result['guardChecks']!=14 or result['catalogTools']!=83:raise RuntimeError('unexpected_current_product_counts')
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(result,indent=2))
print(json.dumps(result))
