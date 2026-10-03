const addresses = value => String(value ?? '').toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g) || [];
export function verifyReplyPreview(answer, {mailbox, request, packet}) {
  const plain = answer.replace(/\*\*/g, '').replace(/`/g, '').split(/\r?\n/).map(line => {
    const row = line.match(/^\s*\|\s*([^|]+?)\s*\|\s*([^|]+)\s*\|\s*$/);
    return row ? row[1] + ': ' + row[2] : line.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, '');
  }).join('\n');
  const field = name => plain.match(new RegExp('^\\s*'+name+'\\s*:\\s*(.+)$','im'))?.[1]?.trim();
  const failures = [];
  const fromValues = [], toValues = [];
  const from = field('From(?:\\s*\\([^)]*\\))?'), to = field('To');
  if (from) fromValues.push(from);
  if (to) toValues.push(to);
  const paired = plain.match(/^\s*(From|To)\s*\/\s*(From|To)\s*:\s*(.+)$/im);
  if (paired && paired[1].toLowerCase() !== paired[2].toLowerCase()) {
    const values = paired[3].split(/\s+\/\s+/);
    if (values.length === 2) paired.slice(1,3).forEach((label, index) => (label.toLowerCase() === 'from' ? fromValues : toValues).push(values[index]));
  }
  if (!fromValues.length || fromValues.some(value => addresses(value).length !== 1 || addresses(value)[0] !== mailbox.email.toLowerCase())) failures.push('preview_from_mismatch');
  const expectedTo = addresses(typeof request.metadata?.recipient === 'string' ? request.metadata.recipient : JSON.stringify(request.metadata?.recipient || ''));
  const exactRecipients = value => JSON.stringify(addresses(value).sort()) === JSON.stringify([...expectedTo].sort());
  if (!expectedTo.length || !toValues.length || toValues.some(value => !exactRecipients(value))) failures.push('preview_to_mismatch');
  const copies = [...plain.matchAll(/^\s*(Cc\s*[/&]\s*Bcc|Cc|Bcc)\s*:\s*(.+)$/gim)];
  const inline = [...plain.matchAll(/(?<=[.!?]\s)(Cc\s*[/&]\s*Bcc)\s*:\s*(none|empty|\[\]|—|-)\s*[.]?\s*$/gim)];
  copies.push(...inline);
  const combined = copies.filter(m=>/[/&]/.test(m[1])).map(m=>m[2]);
  const cc = copies.filter(m=>m[1].toLowerCase()==='cc').map(m=>m[2]);
  const bcc = copies.filter(m=>m[1].toLowerCase()==='bcc').map(m=>m[2]);
  const none = value => typeof value === 'string' && /^(?:none|empty|\[\]|—|-)\s*[.]?$/i.test(value);
  if (!copies.length || copies.some(m=>!none(m[2])) || !combined.length && (!cc.length || !bcc.length)) failures.push('preview_cc_bcc_not_explicit');
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
  const exactAmount = value => {
    const [whole, cents] = value.toFixed(2).split('.');
    const fraction = cents.endsWith('0') ? cents[0]+'0?' : cents;
    return new RegExp('(?<![0-9.])'+whole+'\\.'+fraction+'(?![0-9.])').test(body);
  };
  if (!money || !exactAmount(money.min) || !exactAmount(money.max)) failures.push('preview_price_mismatch');
  if (!packet.integrity?.packetDigest || !answer.includes(packet.integrity.packetDigest)) failures.push('preview_packet_digest_mismatch');
  return {valid: failures.length === 0, failures, bodyCharacterCount: body.length};
}

export function verifyComposePreview(answer, {mailbox, recipient, subject}) {
  const plain = answer.replace(/\*\*/g,'').replace(/`/g,'').split(/\r?\n/).map(line => {
    const row = line.match(/^\s*\|\s*([^|]+?)\s*\|\s*([^|]+)\s*\|\s*$/);
    return row ? row[1]+': '+row[2] : line.replace(/^\s*[-*+]\s+/,'');
  }).join('\n');
  const field = name => plain.match(new RegExp('(?:^|[—–]\\s*)'+name+'\\s*:\\s*(.+)$','im'))?.[1]?.trim();
  const failures = [];
  const equalAddress = (value, expected) => addresses(value).length === 1 && addresses(value)[0] === expected.toLowerCase();
  if (!equalAddress(field('From'),mailbox.email)) failures.push('compose_from_mismatch');
  if (!equalAddress(field('To'),recipient)) failures.push('compose_to_mismatch');
  const none = value => typeof value === 'string' && /^(?:none|empty|\[\]|—|-)\s*[.]?$/i.test(value);
  if (!none(field('Cc\\s*[/&]\\s*Bcc')) && (!none(field('Cc')) || !none(field('Bcc')))) failures.push('compose_cc_bcc_not_explicit');
  if (field('Subject') !== subject) failures.push('compose_subject_mismatch');
  const body = plain.match(/Subject\s*:[^\n]*\n([\s\S]+)/i)?.[1]?.trim() || '';
  if (body.length < 30 || !/thank you/i.test(body) || !/notes/i.test(body) || !/tomorrow/i.test(body) || !/call|meeting/i.test(body)) failures.push('compose_body_incomplete');
  if (/\b(?:I have|I.ve|successfully) (?:sent|saved|replied)\b/i.test(answer)) failures.push('compose_false_delivery_claim');
  return {valid: failures.length === 0, failures};
}
