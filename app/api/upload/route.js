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

  const fwd = new FormData();
  fwd.append('file', file, name);

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
