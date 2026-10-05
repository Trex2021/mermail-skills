import json, sys, time, tkinter as tk
from pathlib import Path
state_path, events_path = map(Path, sys.argv[1:3])
BG, PANEL, BORDER, TEXT, MUTED, GREEN, BLUE = '#07131f', '#102234', '#23425c', '#edf5fb', '#9db5c9', '#70e5b4', '#7cbaff'
root = tk.Tk(); root.title('Mermail Freelance Margin Guard — live current-head proof')
root.geometry('1280x720+0+0'); root.overrideredirect(True); root.configure(bg=BG)
start=time.monotonic()
def label(parent,text,font=('DejaVu Sans',14),fg=TEXT,**kw):
    w=tk.Label(parent,text=text,font=font,bg=parent.cget('bg'),fg=fg,justify='left',anchor='w',**kw);w.pack(fill='x');return w
header=tk.Frame(root,bg=BG);header.pack(fill='x',padx=28,pady=(18,12))
label(header,'MERMAIL  /  FREELANCE MARGIN GUARD',('DejaVu Sans',23,'bold'))
status=label(header,'Continuous live proof • English • synthetic self-addressed mail',('DejaVu Sans',12),MUTED)
body=tk.Frame(root,bg=BG);body.pack(fill='both',expand=True,padx=28)
left=tk.Frame(body,bg=PANEL,width=666,highlightbackground=BORDER,highlightthickness=1);left.pack(side='left',fill='both',expand=True,padx=(0,14));left.pack_propagate(False)
right=tk.Frame(body,bg=PANEL,width=520,highlightbackground=BORDER,highlightthickness=1);right.pack(side='left',fill='both');right.pack_propagate(False)
lf=tk.Frame(left,bg=PANEL);lf.pack(fill='both',expand=True,padx=18,pady=14)
label(lf,'OWNER REQUEST · ACTUAL SESSION INPUT',('DejaVu Sans',12,'bold'),BLUE)
prompt=label(lf,'',('DejaVu Sans',11),TEXT,wraplength=608)
label(lf,'\nOBSERVED ACTIVITY · LIVE TOOL EVENTS',('DejaVu Sans',12,'bold'),BLUE)
timeline=label(lf,'Waiting for the fresh agent session…',('DejaVu Sans Mono',11),MUTED,wraplength=608)
rf=tk.Frame(right,bg=PANEL);rf.pack(fill='both',expand=True,padx=20,pady=14)
phase=label(rf,'CONNECTING / READING',('DejaVu Sans',17,'bold'),BLUE)
intro=label(rf,'The installed skill chooses a route, reads the selected sources and builds a verified decision packet.',('DejaVu Sans',13),MUTED,wraplength=468)
result=label(rf,'',('DejaVu Sans',16,'bold'),GREEN,wraplength=468)
options=label(rf,'',('DejaVu Sans',12),TEXT,wraplength=468)
prior=label(rf,'',('DejaVu Sans',11),MUTED,wraplength=468)
footer=tk.Frame(root,bg=BG);footer.pack(fill='x',padx=28,pady=(12,16))
foot=label(footer,'Hypothetical owner estimates • no real client revenue or payment claim',('DejaVu Sans',11),MUTED)
def money(r):
    return 'unpriced' if not r else f"${r['min']:,.2f}–${r['max']:,.2f}"
def tick():
    try:
        state=json.loads(state_path.read_text()); elapsed=int(time.monotonic()-start)
        status.config(text=f"LIVE / one take  ·  product {state['head'][:7]}  ·  public run {state['runId']}  ·  {elapsed//60}:{elapsed%60:02d}")
        prompt.config(text=state['prompt'])
        events=[]
        for line in events_path.read_text().splitlines():
            try: events.append(json.loads(line))
            except json.JSONDecodeError: pass
        lines=[]
        for e in events:
            tool=e.get('tool','');kind=e.get('kind','');stamp=e.get('at','')[11:19]
            if kind=='skill_loaded': msg='Loaded installed Margin Guard skill'
            elif kind=='request_started': msg=f"Mermail {tool} → requested"
            elif kind=='live_read': msg=f"Mermail {tool} → {'completed' if e.get('success') else 'failed'}"+(' ['+e['slot']+']' if e.get('slot') else '')
            elif kind=='local_builder': msg='Product packet builder → '+('verified' if e.get('success') else 'rejected input')
            else: continue
            lines.append(stamp+' UTC  '+msg)
        timeline.config(text='\n'.join(lines[-8:]) or 'Waiting for the fresh agent session…')
        outcome=state.get('summary'); checks=outcome.get('prior',[]) if outcome else state.get('prior',[])
        names={'01-natural-selection':'Natural routing + absent-rate stop','02-neighbor-routing':'Neighbor request → Compose Email','04-approval-boundary':'Exact preview + fresh-approval stop','05-hostile-tool-content':'Hostile source cannot rewrite authority','03-bounded-happy-path':'Selected reads + verified pricing'}
        prior.config(text='\n\nFRESH SESSION CHECKS IN THIS RUN\n'+'\n'.join(r['result']+'  '+names.get(r['case'],r['case']) for r in checks))
        if outcome and outcome['result']=='PASS':
            phase.config(text='VERIFIED RESULT',fg=GREEN)
            intro.config(text='Two selected Mermail messages → host-grounded sources → current product builder → independently checked packet.')
            h=outcome['addedHours'];result.config(text=f"\n{h['min']}–{h['max']} added hours\n{money(outcome['baseFee'])} ordinary fee\n{money(outcome['rushFee'])} with rush\n")
            parts=[]
            for o in outcome['options']:
                if o['id']=='remove_or_swap': parts.append('1  REMOVE / SWAP · retain the accepted scope')
                elif o['id']=='extend_schedule':
                    d=o.get('deadlineRange') or {};parts.append('2  EXTEND · '+money(o['feeRange'])+'\n    '+str(d.get('earliest',''))+' to '+str(d.get('latest','')))
                elif o['id']=='paid_change_order': parts.append('3  PAID CHANGE · '+money(o['feeRange'])+'\n    Requested date: '+str(o.get('deadline','')))
            options.config(text='THREE EVIDENCE-LINKED OPTIONS\n\n'+'\n\n'.join(parts))
            foot.config(text='Hypothetical owner estimates · no writes attempted or forwarded · no wallet, transfer or message send')
        elif state.get('phase')=='failed':
            phase.config(text='EVALUATION FAILED',fg='#ff8c8c');options.config(text='\n'.join(outcome.get('failures',[])))
    except (OSError,json.JSONDecodeError,KeyError,TypeError): pass
    root.after(200,tick)
tick();root.mainloop()
