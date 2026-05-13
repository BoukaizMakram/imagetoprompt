# Prompto — Image to Prompt

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
| `SMTP_HOST` | yes (contact form) | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | yes (contact form) | `587` (STARTTLS) or `465` (SMTPS) |
| `SMTP_USER` | yes (contact form) | SMTP login (typically your email) |
| `SMTP_PASS` | yes (contact form) | App password from your mail provider |
| `CONTACT_FROM_EMAIL` | optional | Display name + address in the `From:` line |

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
  page.tsx                 — landing page
  layout.tsx, globals.css
  icon.png, apple-icon.png — favicon / touch icon
  api/generate/route.ts    — image-to-prompt + moderation
  api/contact/route.ts     — contact form -> SMTP
  about/, contact/, privacy/, terms/, refund/  — legal pages
  prompt-generator/, describe/, tutorials/     — supporting pages
components/
  Header.tsx, Logo.tsx, Footer.tsx
  PromptStudio.tsx         — main drop zone + output + carousel
  Features.tsx, HowItWorks.tsx
  Testimonials.tsx, HowToUse.tsx, FAQ.tsx
  ContactForm.tsx, LegalPage.tsx
public/
  logo.png
```
