# Redirect Worker Setup

This document describes how to set up the dedicated Cloudflare Worker for handling clean public redirect URLs on `go.tubelinkr.com`.

## Overview

The redirect Worker handles:
- `/{username}/{slug}` (base link)
- `/{username}/{slug}/{public_code}` (placement link)

This keeps the main app on `tubelinkr.com` (Cloudflare Pages) and moves all public redirect handling to a dedicated Worker on `go.tubelinkr.com`.

## Files Created

1. **redirect-worker.js** - The Worker code that handles clean URL redirects
2. **wrangler-redirect.toml** - Wrangler configuration for the Worker

## D1 Bindings

The Worker is already configured to use the existing D1 database:
- Database name: `tubelinkr-db`
- Database ID: `7fd2cd09-fafa-496f-8310-a7e86ca5c03c`
- Binding name: `DB`

## Deployment Steps

### 1. Deploy the Worker

```bash
npx wrangler deploy --config wrangler-redirect.toml
```

This will deploy the Worker to Cloudflare with the name `tubelinkr-redirect-worker`.

### 2. Add Custom Domain

In the Cloudflare Dashboard:

1. Go to **Workers & Pages**
2. Select **tubelinkr-redirect-worker**
3. Go to **Settings** > **Triggers**
4. Click **Add Custom Domain**
5. Enter: `go.tubelinkr.com`
6. Click **Add Custom Domain**

### 3. Configure DNS

In the Cloudflare Dashboard for the `tubelinkr.com` zone:

1. Go to **DNS** > **Records**
2. Add a CNAME record:
   - Name: `go`
   - Type: `CNAME`
   - Target: `tubelinkr-redirect-worker.YOUR_ACCOUNT.workers.dev`
   - Proxy status: Proxied (orange cloud)

Note: The target will be provided after deploying the Worker in step 1.

### 4. Verify DNS Propagation

After adding the DNS record, wait for DNS propagation (usually a few minutes). You can verify with:

```bash
dig go.tubelinkr.com
```

## Testing

Once deployed, test the Worker with:

1. Base link: `https://go.tubelinkr.com/{username}/{slug}`
2. Placement link: `https://go.tubelinkr.com/{username}/{slug}/{public_code}`

Example:
```
https://go.tubelinkr.com/tubelinkr/testamz/bio
```

## Worker Logs

To view Worker logs:

```bash
npx wrangler tail --config wrangler-redirect.toml
```

## Backward Compatibility

The Worker supports:
- Clean URLs with `public_code` (new format)
- Query parameter `?source=` (old format)
- Direct `source_code` in path (backward compatibility)

## Architecture

```
User visits: https://go.tubelinkr.com/tubelinkr/testamz/bio
    ↓
DNS resolves to: tubelinkr-redirect-worker.workers.dev
    ↓
Worker handles request:
    1. Parse username, slug, public_code
    2. Lookup user_id from username
    3. Lookup link by user_id + slug
    4. Lookup placement by link_id + public_code
    5. Use placement.source_code for attribution
    6. Record click event
    7. Redirect to original_url
```

## Security Considerations

- The Worker is isolated from the main Pages app
- If the Worker fails, the main app remains unaffected
- The Worker uses the same D1 database as the main app
- All database queries are parameterized to prevent SQL injection
