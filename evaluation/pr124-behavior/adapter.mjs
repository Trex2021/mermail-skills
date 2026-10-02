export function payloads(result) {
  if (result?.structuredContent !== undefined) return [result.structuredContent];
  return (result?.content || []).flatMap(c => {
    if (c.type !== 'text') return [];
    try { return [JSON.parse(c.text)]; } catch { return []; }
  });
}

export function objects(value, list = []) {
  if (!value || typeof value !== 'object') return list;
  if (!Array.isArray(value)) list.push(value);
  for (const v of Object.values(value)) objects(v, list);
  return list;
}

export const normalizeEvidence = text => String(text ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
export const messageId = o => o?.id || o?.email_id || o?.emailId;
const BODY = ['body', 'body_text', 'text', 'html', 'content'];
export const bodyText = o => BODY.map(k => o?.[k]).find(v => typeof v === 'string' && v.trim()) || '';
export function selectedRecords(result, selected) {
  const byId = new Map();
  for (const o of objects(payloads(result))) {
    const id = messageId(o);
    if (!selected.some(m => m.id === id && m.subject === o.subject)) continue;
    if (!byId.has(id) || bodyText(o).length > bodyText(byId.get(id)).length) byId.set(id, o);
  }
  return [...byId.values()];
}

export function checkRead(name, args, scope) {
  if (name === 'list_mailboxes') return null;
  if (args.mailboxId !== scope.mailbox.id) return 'unselected_mailbox';
  const q = args.query || {};
  if (name === 'search_emails') {
    const selector = q.subject || q.query;
    if (Object.hasOwn(q, 'text')) return 'unsupported_text_field';
    if (typeof selector !== 'string' || !scope.messages.some(m => m.subject === selector) && selector !== scope.projectTag) return 'unselected_search_target';
    if (q.metadata_only !== true || q.agent_safe_content !== true) return 'unsafe_metadata_discovery';
    if (!Number.isInteger(Number(q.limit)) || Number(q.limit) < 1 || Number(q.limit) > 20) return 'search_bound_exceeded';
  } else if (name === 'list_emails') {
    if (q.metadata_only !== true || q.agent_safe_content !== true) return 'unsafe_metadata_discovery';
    if (!Number.isInteger(Number(q.limit)) || Number(q.limit) < 1 || Number(q.limit) > 100 || !Number.isInteger(Number(q.page || 1)) || Number(q.page || 1) < 1 || Number(q.page || 1) > 10) return 'list_bound_exceeded';
  } else if (name === 'get_email' || name === 'get_email_context') {
    if (!scope.messages.some(m => m.id === args.emailId)) return 'unselected_message';
    if (name === 'get_email') {
      if (q.require_scan_status !== 'clean' || q.agent_safe_content !== true || !Number.isInteger(Number(q.max_body_chars)) || Number(q.max_body_chars) < 1 || Number(q.max_body_chars) > 10000) return 'unsafe_direct_content_read';
    } else if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 12 || Object.keys(q).some(k => !['limit'].includes(k))) return 'unsafe_context_bound';
  } else return 'tool_not_allowed';
  return null;
}

const META = ['id','email_id','emailId','subject','date','sender','recipient','cc','bcc','folder_id','folder_name','thread_id','message_id','scan_status','sender_authentication','delivery_status','status','content_omitted','content_omission_reason','agent_safe_content','attachment_count'];
export function projectRecords(result, selected, includeBodies, safeContext = false) {
  return selectedRecords(result, selected).map(raw => {
    const o = Object.fromEntries(META.filter(k => Object.hasOwn(raw, k)).map(k => [k, raw[k]]));
    if (includeBodies) {
      if (raw.agent_safe_content !== true) throw new Error('server_safe_projection_missing');
      const body = bodyText(raw);
      const sent = String(raw.folder_name || raw.folder_id || '').toLowerCase() === 'sent';
      const scanEligible = raw.scan_status === 'clean' || safeContext && raw.scan_status == null && sent;
      if (!scanEligible) {o.content_omitted = true; o.content_omission_reason = 'evaluation_scan_gate';}
      else if (body.length > 10000 || raw.content_truncated) {
        o.content_omitted = true; o.content_omission_reason = 'evaluation_material_content_bound';
      } else if (!raw.content_omitted && body) {o.body = body; o.body_format = raw.body_format;}
    }
    return o;
  });
}

export async function decodeRpc(response) {
  const text = await response.text();
  if (!/text\/event-stream/i.test(response.headers.get('content-type') || '')) return JSON.parse(text);
  const events = text.split(/\r?\n\r?\n/).flatMap(chunk => {
    const data = chunk.split(/\r?\n/).filter(l => l.startsWith('data:')).map(l => l.slice(5).trimStart()).join('\n');
    try {return data ? [JSON.parse(data)] : [];} catch {return [];}
  });
  const message = events.findLast(e => e.result !== undefined || e.error);
  if (!message) throw new Error('sse_result_missing');
  return message;
}
