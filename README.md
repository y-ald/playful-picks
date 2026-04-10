# Kaia Kids - Playful Picks

## Project info

**Lovable**: https://lovable.dev/projects/3923f859-5de7-429d-b09a-7e8f16b14485
**Supabase Project Ref**: `ktmqwhkywxogxktuqcfx`

## Tech Stack

- Vite 5 + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Database, Edge Functions, Realtime)
- Stripe (Payments)
- Shippo (Shipping)
- Mapbox (Address autocomplete)
- TanStack React Query v5

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd playful-picks
npm i
cp .env.example .env   # Fill in your keys
npm run dev
```

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `vite` | Dev server (port 8080) |
| `npm run build` | `vite build` | Production build |
| `npm run build:dev` | `vite build --mode development` | Dev build with sourcemaps |
| `npm run preview` | `vite preview` | Preview production build |
| `npm run lint` | `eslint .` | Run linter |

## Supabase CLI

### Installation & Auth

```sh
# Install Supabase CLI globally (optional)
npm install -g supabase

# Login (opens browser for access token)
npx supabase login

# Link project locally
npx supabase link --project-ref ktmqwhkywxogxktuqcfx
```

### Edge Functions - Deploy

```sh
# Deploy ALL functions at once
npx supabase functions deploy --project-ref ktmqwhkywxogxktuqcfx

# Deploy individual functions
npx supabase functions deploy create-checkout --no-verify-jwt --project-ref ktmqwhkywxogxktuqcfx
npx supabase functions deploy stripe-webhook --no-verify-jwt --project-ref ktmqwhkywxogxktuqcfx
npx supabase functions deploy shipping --no-verify-jwt --project-ref ktmqwhkywxogxktuqcfx
npx supabase functions deploy send-email --no-verify-jwt --project-ref ktmqwhkywxogxktuqcfx
npx supabase functions deploy admin-get-stats --project-ref ktmqwhkywxogxktuqcfx
npx supabase functions deploy admin-get-customers --project-ref ktmqwhkywxogxktuqcfx
```

### Edge Functions - Serve Locally

```sh
# Serve all functions locally (for testing)
npx supabase functions serve --project-ref ktmqwhkywxogxktuqcfx

# Serve a specific function
npx supabase functions serve create-checkout --project-ref ktmqwhkywxogxktuqcfx
```

### Edge Functions - Logs

```sh
# View recent logs for a function
npx supabase functions logs create-checkout --project-ref ktmqwhkywxogxktuqcfx
npx supabase functions logs stripe-webhook --project-ref ktmqwhkywxogxktuqcfx
npx supabase functions logs shipping --project-ref ktmqwhkywxogxktuqcfx
npx supabase functions logs send-email --project-ref ktmqwhkywxogxktuqcfx
```

### Edge Functions - Secrets

```sh
# List all secrets
npx supabase secrets list --project-ref ktmqwhkywxogxktuqcfx

# Set secrets (required for Edge Functions)
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx --project-ref ktmqwhkywxogxktuqcfx
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx --project-ref ktmqwhkywxogxktuqcfx
npx supabase secrets set SHIPPO_API_KEY=shippo_live_xxx --project-ref ktmqwhkywxogxktuqcfx
npx supabase secrets set ADMIN_EMAIL=admin@yourdomain.com --project-ref ktmqwhkywxogxktuqcfx

# Unset a secret
npx supabase secrets unset SECRET_NAME --project-ref ktmqwhkywxogxktuqcfx
```

### Database

```sh
# Generate TypeScript types from DB schema
npx supabase gen types typescript --project-id ktmqwhkywxogxktuqcfx > src/integrations/supabase/types.ts

# Create a new migration
npx supabase migration new my_migration_name

# Push migrations to remote
npx supabase db push --project-ref ktmqwhkywxogxktuqcfx

# Pull remote schema to local
npx supabase db pull --project-ref ktmqwhkywxogxktuqcfx

# Reset local database
npx supabase db reset

# Diff local vs remote schema
npx supabase db diff --project-ref ktmqwhkywxogxktuqcfx
```

### Local Development

```sh
# Start local Supabase (Docker required)
npx supabase start

# Stop local Supabase
npx supabase stop

# Check local Supabase status
npx supabase status
```

### Project Info

```sh
# Show project API keys and URLs
npx supabase projects list

# Show linked project info
npx supabase status
```

## Edge Functions Reference

| Function | JWT | Description |
|----------|-----|-------------|
| `create-checkout` | No | Creates Stripe checkout session with server-side price validation |
| `stripe-webhook` | No | Handles Stripe payment events (order creation, inventory, shipping, emails) |
| `shipping` | No | Shippo API proxy (rates, labels, tracking) |
| `send-email` | No | Transactional email sending |
| `admin-get-stats` | Yes | Dashboard statistics (admin only) |
| `admin-get-customers` | Yes | Customer list (admin only) |

## Environment Variables

See `.env.example` for all required variables.

| Variable | Where | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase anon/public key |
| `VITE_MAPBOX_ACCESS_TOKEN` | Client | Mapbox address search |
| `VITE_ADMIN_EMAIL` | Client | Admin notification email |
| `STRIPE_SECRET_KEY` | Edge Function secret | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Edge Function secret | Stripe webhook signing secret |
| `SHIPPO_API_KEY` | Edge Function secret | Shippo shipping API key |
| `ADMIN_EMAIL` | Edge Function secret | Admin email for order notifications |

## Stripe Test Cards

Use these card numbers in **test mode** to simulate different payment scenarios:

| Scenario | Card Number | Expiry | CVC | ZIP |
|----------|-------------|--------|-----|-----|
| Payment succeeds | `4242 4242 4242 4242` | Any future date | Any 3 digits | Any 5 digits |
| Payment requires authentication (3D Secure) | `4000 0025 0000 3155` | Any future date | Any 3 digits | Any 5 digits |
| Payment is declined | `4000 0000 0000 9995` | Any future date | Any 3 digits | Any 5 digits |
| Insufficient funds | `4000 0000 0000 9995` | Any future date | Any 3 digits | Any 5 digits |
| Card expired | `4000 0000 0000 0069` | Any future date | Any 3 digits | Any 5 digits |
| Incorrect CVC | `4000 0000 0000 0127` | Any future date | Any 3 digits | Any 5 digits |
| Processing error | `4000 0000 0000 0119` | Any future date | Any 3 digits | Any 5 digits |

**International cards:**

| Country | Card Number |
|---------|-------------|
| US (Visa) | `4242 4242 4242 4242` |
| CA (Visa) | `4000 0012 4000 0000` |
| FR (Visa) | `4000 0025 0000 0003` |
| GB (Visa) | `4000 0082 6000 0000` |
| DE (Visa) | `4000 0027 6000 0016` |
| AU (Visa) | `4000 0003 6000 0006` |
| BE (Visa) | `4000 0005 6000 0004` |
| ES (Visa) | `4000 0072 4000 0007` |

> Full list: https://docs.stripe.com/testing#cards

## Deployment

**Frontend**: Open [Lovable](https://lovable.dev/projects/3923f859-5de7-429d-b09a-7e8f16b14485) > Share > Publish

**Edge Functions**: See Supabase CLI commands above

**Custom domain**: Use Netlify - see [docs](https://docs.lovable.dev/tips-tricks/custom-domain/)