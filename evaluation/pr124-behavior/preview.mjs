const addresses = value => String(value ?? '').toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g) || [];
export function verifyReplyPreview(answer, {mailbox, request, packet}) {
  const plain = answer.replace(/\*\*/g, '').replace(/`/g, '').split(/\r?\n/).map(line => {
    const row = line.match(/^\s*\|\s*([^|]+?)\s*\|\s*([^|]+)\s*\|\s*$/);
    return row ? row[1] + ': ' + row[2] : line;
  }).join('\n');
  const field = name => plain.match(new RegExp('^\\s*'+name+'\\s*:\\s*(.+)$','im'))?.[1]?.trim();
  const failures = [];
  const from = field('From(?:\\s*\\([^)]*\\))?'), to = field('To');
  if (addresses(from).length !== 1 || addresses(from)[0] !== mailbox.email.toLowerCase()) failures.push('preview_from_mismatch');
  const expectedTo = addresses(typeof request.metadata?.recipient === 'string' ? request.metadata.recipient : JSON.stringify(request.metadata?.recipient || ''));
  const actualTo = addresses(to);
  if (!expectedTo.length || actualTo.length !== expectedTo.length || actualTo.some(a => !expectedTo.includes(a))) failures.push('preview_to_mismatch');
  const cc = field('Cc'), bcc = field('Bcc'), combined = field('Cc\\s*[/&]\\s*Bcc');
  const none = value => typeof value === 'string' && /^(?:none|empty|\[\]|—|-)\s*[.]?$/i.test(value);
  if (!none(combined) && (!none(cc) || !none(bcc))) failures.push('preview_cc_bcc_not_explicit');
  const subject = field('Subject');
  if (!subject || subject.replace(/^re:\s*/i,'') !== request.subject) failures.push('preview_subject_mismatch');
  const source = field('(?:Source[^:\n]*(?:message|thread)[^:\n]*|Thread[^:\n]*|Reply(?:\\s+to)?[^:\n]*message[^:\n]*)');
  if (!source?.includes(request.id)) failures.push('preview_reply_target_missing');
  const quoted = answer.split(/\r?\n/).filter(l => /^\s*>/.test(l)).map(l => l.replace(/^\s*>\s?/, '')).join('\n').trim();
  const labeled = plain.match(/^\s*Body\s*:\s*([\s\S]+?)(?=\n#{1,6}\s|\n(?:State|Integrity|Evidence digest|Packet digest)\s*:|$)/im)?.[1]?.trim();
  const body = quoted || labeled || '';
  if (body.length < 80) failures.push('preview_body_missing');
  if (!/(?:2026-10-15|October\s+15,?\s+2026|15\s+October\s+2026)/i.test(body)) failures.push('preview_deadline_missing');
  const money = packet.marginSnapshot?.completeTotalFeeRange;
  if (!money || !body.includes(money.min.toFixed(2)) || !new RegExp(String(money.max).replace('.', '\\.')+'0?(?![0-9])').test(body)) failures.push('preview_price_mismatch');
  if (!packet.integrity?.packetDigest || !answer.includes(packet.integrity.packetDigest)) failures.push('preview_packet_digest_mismatch');
  return {valid: failures.length === 0, failures, bodyCharacterCount: body.length};
}
