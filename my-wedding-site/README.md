# My Wedding Site (Next.js)

A simple bilingual wedding website (English/French) built with Next.js and next-i18next, deployed on Netlify. Includes an RSVP form that writes to Google Sheets via a Next.js API route.

## Prerequisites
- Node.js LTS installed
- A code editor (VS Code)
- Git + GitHub account
- Netlify account

## Getting started (local)
1. Install dependencies:
   ```powershell
   cd c:\Users\User\Documents\Code\MarriageWebsite\my-wedding-site
   npm install
   ```
2. Run the dev server:
   ```powershell
   npm run dev
   ```
   Open http://localhost:3000

## i18n (English/French)
- Translations live in `public/locales/{en|fr}/*.json`.
- Switch language using the toggle in the navbar.

## RSVP to Google Sheets
1. Create a Google Sheet with columns: `Name, Email, Attending, DietaryRestrictions, PlusOneName, Timestamp` (A-F).
2. In Google Cloud Console:
   - Create a project, enable Google Sheets API.
   - Create a Service Account, generate a key (JSON).
   - Share the Sheet with the service account email (Editor).
3. Create `.env.local` in the project root based on `.env.local.example` and fill:
   - `GOOGLE_SHEETS_CLIENT_EMAIL`
   - `GOOGLE_SHEETS_PRIVATE_KEY` (keep line breaks as `\n` if on one line)
   - `GOOGLE_SHEETS_SPREADSHEET_ID`
   - (Optional) `GOOGLE_SHEETS_RANGE`
4. Restart `npm run dev` and test the form at `/rsvp`.

## Deploy to Netlify
1. Push this folder to a new GitHub repo:
   ```powershell
   git init
   git add .
   git commit -m "Initial wedding site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. In Netlify, "Add new site" -> "Import from Git" and select your repo.
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Add plugin: `@netlify/plugin-nextjs` (netlify.toml included)
4. Set environment variables in Netlify (Site settings -> Environment): the same values from `.env.local`.
5. Deploy. Netlify gives you a test URL.
6. Add your custom domain in Netlify and update DNS at your registrar.

## Customizing the design
- Current styles are in `styles/globals.css`. You can later add Tailwind CSS if you prefer.

## Scripts
- `npm run dev` – start dev server
- `npm run build` – build for production
- `npm start` – start production server locally

## Troubleshooting
- If i18n translations don’t load, confirm the JSON files exist for both `en` and `fr` and that page `getStaticProps` includes the right namespaces.
- For Google Sheets, ensure the service account has access and env vars are set correctly.
 - Google auth error `ERR_OSSL_UNSUPPORTED` or `DECODER routines::unsupported` when submitting RSVP:
   - Your private key env var is not in PEM format. Fix one of these ways:
     1) Paste the `private_key` from your Google service account JSON exactly as-is into `.env.local`, replacing real newlines with `\n` and wrap it in quotes:
        `GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`
     2) Or set `GOOGLE_SHEETS_PRIVATE_KEY_BASE64` to a base64-encoded PEM.
   - Ensure the Sheet is shared with the `GOOGLE_SHEETS_CLIENT_EMAIL` (Editor).
   - Restart the dev server after changes.
