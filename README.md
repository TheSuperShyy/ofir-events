# Ofir Events — Inventory PDF Upload (Vercel)

A small Next.js page where staff upload a **price-quote (PQ)** or **approved-order** PDF. The page forwards
the file to the n8n **"Webhook (PDF upload)"** node, which parses it and updates the inventory sheet.

```
Browser (upload page)  ──►  /api/upload (this app, server-side)  ──►  n8n webhook  ──►  parse → sheet
```

The proxy at `/api/upload` keeps the n8n webhook URL private and avoids browser CORS issues.

## Local dev
```bash
cd web
npm install
cp .env.example .env.local      # then set N8N_WEBHOOK_URL
npm run dev                     # http://localhost:3000
```

## Deploy to Vercel
1. Push this repo (or the `web/` folder) to GitHub.
2. In Vercel: **New Project** → import the repo → set **Root Directory** to `web`.
3. Add an Environment Variable:
   - `N8N_WEBHOOK_URL` = the n8n node's **Production** URL, e.g. `https://<your-n8n-host>/webhook/inventory-doc-upload`
4. Deploy. The framework (Next.js) is auto-detected — no extra config.

## Contract with n8n
- Method: `POST`, `multipart/form-data`
- Field: **`file`** = the PDF
- The n8n **Normalize upload** node looks for the PDF in the request binary and exposes it as `pdf`.

## Notes
- PDF-only is enforced both client-side and in the proxy.
- The logo lives at `web/public/logo.png`.
- Branding palette (from the logo): lime `#8cbf3f`, warm gray `#6f6a62`.
