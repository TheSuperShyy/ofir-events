// Proxy: receives the uploaded PDF (same-origin, no CORS) and forwards it to the n8n webhook
// as multipart/form-data with field 'file' — exactly what the "Normalize upload" node expects.
// The webhook URL is kept server-side in N8N_WEBHOOK_URL (never exposed to the browser).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const webhook = process.env.N8N_WEBHOOK_URL;
  if (!webhook) {
    return Response.json({ ok: false, error: 'N8N_WEBHOOK_URL is not configured' }, { status: 500 });
  }

  let form;
  try {
    form = await req.formData();
  } catch (e) {
    return Response.json({ ok: false, error: 'invalid form data' }, { status: 400 });
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return Response.json({ ok: false, error: 'no file' }, { status: 400 });
  }

  const name = file.name || 'upload.pdf';
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(name);
  if (!isPdf) {
    return Response.json({ ok: false, error: 'PDF files only' }, { status: 415 });
  }

  // 'quote' | 'order' — which box it came from. n8n ignores it today (routing is from the PDF),
  // but it's forwarded so the automation can log/validate the channel later without a UI change.
  const kind = form.get('kind');
  const hint = kind === 'order' ? 'ORDER' : kind === 'quote' ? 'QUOTE' : '';

  const fwd = new FormData();
  fwd.append('file', file, name);
  if (hint) fwd.append('doc_type_hint', hint);

  let res;
  try {
    res = await fetch(webhook, { method: 'POST', body: fwd });
  } catch (e) {
    return Response.json({ ok: false, error: 'inventory service unreachable' }, { status: 502 });
  }

  if (!res.ok) {
    return Response.json({ ok: false, error: 'inventory service returned ' + res.status }, { status: 502 });
  }

  return Response.json({ ok: true });
}
