import { writeFileSync } from 'node:fs';
const calls = [];
const baseline = 'Accepted scope: one responsive landing page and two revision rounds. Excluded: authenticated application and login, admin dashboard, and payment processing. Acceptance: responsive at agreed desktop, tablet, and mobile breakpoints. Deadline: 2026-10-20.';
const requestBody = 'Change request: add an admin dashboard, Stripe payment processing, user login, two more revision rounds, and deliver five calendar days earlier (2026-10-15). Staging credentials were supplied two days after the agreed access date.';
const sent = process.env.SYNTHETIC_LIVE_MODE === 'sent';
const metadata = [
  { id: 'synthetic-baseline', subject: '[FMG-LIVE-final-independent] Accepted scope', folder_id: sent ? 'Sent' : 'Inbox', date: '2026-08-10T12:00:00Z' },
  { id: 'synthetic-request', subject: '[FMG-LIVE-final-independent] Change request', folder_id: sent ? 'Sent' : 'Inbox', date: '2026-08-29T12:00:00Z' },
];
globalThis.fetch = async (url, options) => {
  if (String(url) !== 'https://console.mermail.app/mcp') throw new Error('Unexpected synthetic URL');
  if (options.redirect !== 'error' || !(options.signal instanceof AbortSignal)) throw new Error('Missing MCP transport boundary');
  const rpc = JSON.parse(options.body);
  calls.push({method:rpc.method,params:rpc.params});
  let result;
  if (rpc.method === 'initialize') result = {serverInfo:{name:'synthetic'}};
  else if (rpc.method === 'tools/list') result = {tools:['list_mailboxes','list_emails','search_emails','get_email','get_email_context'].map(name=>({name}))};
  else if (rpc.method === 'tools/call') {
    const {name,arguments:args} = rpc.params;
    if (name === 'list_mailboxes') result = {structuredContent:{items:[{public_id:'synthetic-mailbox',email:'synthetic@example.test',status:'ready'}]}};
    else if (name === 'list_emails' || name === 'search_emails') result = {structuredContent:{items:metadata}};
    else if (name === 'get_email' || name === 'get_email_context') {
      const meta = metadata.find(item=>item.id===args.emailId);
      if (!meta) throw new Error('Unexpected selected message');
      const omitted = sent && name === 'get_email';
      const email = {id:meta.id,date:meta.date,folder_id:meta.folder_id,is_incoming:!sent,scan_status:sent?null:'clean',agent_safe_content:true,content_omitted:omitted,content_truncated:false,body:omitted?'':meta.id==='synthetic-baseline'?baseline:requestBody};
      result = {structuredContent:{email}};
    } else throw new Error('External write or unrecognized operation denied: '+name);
  } else throw new Error('Unexpected RPC method');
  return Response.json({jsonrpc:'2.0',id:rpc.id,result});
};
process.on('exit',()=>writeFileSync(process.env.SYNTHETIC_LIVE_CALL_LOG,JSON.stringify(calls,null,2)+'\n'));
