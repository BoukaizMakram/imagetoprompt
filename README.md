# imageprompting.org — Image to Prompt

The main app lives at `/image-to-prompt`. Visiting `/` permanently redirects there.


A clean, minimal web app that turns any image into a ready-to-use AI prompt. Drop, paste (Ctrl+V), or upload — get a detailed prompt on the right, with an animated example carousel while you decide.

Built with **Next.js 14 (App Router)** + **Tailwind CSS**.

## Run it locally

```bash
npm install
cp .env.local.example .env.local
# fill in the env vars (see below)
npm run dev
```

Open http://localhost:3000.

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Required | Purpose |
| --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | yes | Account ID from the Cloudflare dashboard |
| `CLOUDFLARE_API_TOKEN` | yes | API token with **Workers AI** permission |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Supabase service-role key (server-only) |
| `STRIPE_SECRET_KEY` | yes (payments) | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | yes (payments) | Stripe webhook signing secret |
| `STRIPE_PRICE_STARTER` | yes (payments) | One-time Price ID — $9.99 / 300 credits |
| `STRIPE_PRICE_PRO` | yes (payments) | One-time Price ID — $18.99 / 600 credits |
| `STRIPE_PRICE_UNLIMITED` | yes (payments) | One-time Price ID — $100 / unlimited |
| `NEXT_PUBLIC_SITE_URL` | yes (payments) | Public site URL, used in Stripe success/cancel URLs |
| `SMTP_HOST` | yes (contact form) | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | yes (contact form) | `587` (STARTTLS) or `465` (SMTPS) |
| `SMTP_USER` | yes (contact form) | SMTP login (typically your email) |
| `SMTP_PASS` | yes (contact form) | App password from your mail provider |
| `CONTACT_FROM_EMAIL` | optional | Display name + address in the `From:` line |

## Supabase setup

1. Create a project at https://supabase.com.
2. **Settings → API** → copy the `URL`, `anon public` key, and `service_role` key into `.env.local`.
3. **SQL editor** → paste and run [`supabase/schema.sql`](supabase/schema.sql). This creates the `profiles`, `credit_balances`, `usage_events`, `purchases` tables, the `consume_credit` / `refund_credit` RPCs, and a trigger that auto-creates a profile + 5 free trial credits on signup.
4. **Authentication → Providers**:
   - **Email**: enable it, then disable "Confirm email" so new users sign in immediately.
   - **Google**: enable it, paste your Google OAuth client ID + secret. In Google Cloud Console add `https://<your-project>.supabase.co/auth/v1/callback` as an authorized redirect URI.
5. **Authentication → URL Configuration**: set the Site URL (e.g. `http://localhost:3000` for dev) and add the same URL plus `/auth/callback` to the redirect allow-list.

## Stripe setup

1. **Products → Add product**, create three products (one-time prices, **NOT** recurring):
   - `Starter` — $9.99 USD
   - `Pro` — $18.99 USD
   - `Unlimited` — $100 USD
2. Copy each Price ID (`price_…`) into the matching `STRIPE_PRICE_*` env var.
3. **Developers → Webhooks → Add endpoint**:
   - URL: `https://<your-site>/api/stripe/webhook`
   - Events: `checkout.session.completed`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. For local dev: `stripe listen --forward-to http://localhost:3000/api/stripe/webhook` and use the printed `whsec_…` as `STRIPE_WEBHOOK_SECRET`.

## Pricing model

| Plan | Price | Credits | Notes |
| --- | --- | --- | --- |
| Starter | $9.99 | 300 / month | one-time payment, no subscription |
| Pro | $18.99 | 600 / month | one-time payment |
| Unlimited | $100 | unlimited | one-time payment, lasts the calendar month |

Credits expire at the end of the calendar month they were purchased in. Buying again next month gives the user a fresh balance.

### Cloudflare credentials

1. Sign in to https://dash.cloudflare.com
2. Copy your **Account ID** from any Workers/Pages page
3. Create an **API Token** at https://dash.cloudflare.com/profile/api-tokens with the **Workers AI** permission (Read)

### Gmail SMTP for the contact form

1. Enable 2-Step Verification on the Gmail account.
2. Create an **App Password** at https://myaccount.google.com/apppasswords (type: Mail).
3. Use `smtp.gmail.com` / `587` and the app password as `SMTP_PASS`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to https://vercel.com/new and import the GitHub repository.
3. Framework preset: **Next.js** (auto-detected). No build overrides needed.
4. In **Environment Variables**, add every variable from the table above for the **Production** and **Preview** scopes.
5. Click **Deploy**.

That's it — Vercel handles the build, the API routes run on the Node.js runtime, and the favicon / icons are picked up from `app/icon.png` automatically.

## How it works

- The frontend lets the user drop, paste, or upload an image.
- It POSTs the file to `/api/generate` along with a style mode (general / Flux / Midjourney / Stable Diffusion).
- A first pass moderates the image for unsafe content. If safe, a second pass generates a style-specific prompt.
- Contact form submissions POST to `/api/contact`, which relays via SMTP using `nodemailer`.

## Project layout

```
app/
  image-to-prompt/page.tsx — main page (drop zone + studio)
  login/page.tsx           — Google + email sign in
  pricing/page.tsx         — three-tier pricing
  account/page.tsx         — credits left + purchases
  layout.tsx, globals.css
  icon.png, apple-icon.png — favicon / touch icon
  auth/callback/route.ts   — Supabase OAuth callback
  auth/signout/route.ts    — sign-out POST endpoint
  api/generate/route.ts    — image-to-prompt + moderation + credits
  api/contact/route.ts     — contact form -> SMTP
  api/stripe/checkout/route.ts — creates Stripe Checkout sessions
  api/stripe/webhook/route.ts  — grants credits on payment
  about/, contact/, privacy/, terms/, refund/  — legal pages
  prompt-generator/, describe/, tutorials/     — supporting pages
components/
  Header.tsx, HeaderNav.tsx, Logo.tsx, Footer.tsx
  LoginForm.tsx, BuyButton.tsx, SignOutButton.tsx
  PromptStudio.tsx         — main drop zone + output + carousel
  Features.tsx, HowItWorks.tsx
  Testimonials.tsx, HowToUse.tsx, FAQ.tsx
  ContactForm.tsx, LegalPage.tsx
lib/
  plans.ts                 — plan definitions (Starter / Pro / Unlimited)
  stripe.ts                — Stripe client
  supabase/{client,server,middleware}.ts — Supabase clients
middleware.ts              — refreshes Supabase session cookies
supabase/schema.sql        — run once in the Supabase SQL editor
public/
  logo.png
```
