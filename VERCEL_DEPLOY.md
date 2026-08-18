Security first
--------------

1) The token you posted is a secret. Do not paste it in chat. Since it was posted publicly here, revoke it immediately in the Vercel dashboard and generate a new token.
   - Vercel dashboard -> Settings -> Tokens -> Revoke the exposed token -> Create New Token

Prepare the repo for Vercel (what was added)
-------------------------------------------
- vercel.json (root) added to ensure Vercel uses the Next.js builder.

Recommended deployment flows (pick one)
---------------------------------------
A) Git integration (recommended)
  1. Push your repo to GitHub (or GitLab/Bitbucket).
  2. In Vercel dashboard, use "Import Project" and connect the repository.
  3. In the import settings, ensure these values (if not auto-detected):
     - Framework Preset: Next.js
     - Install Command: npm ci
     - Build Command: npm run build
     - Output Directory: .next
  4. Add required Environment Variables in the Vercel Project Settings (Settings -> Environment Variables).
     Common vars this project likely needs:
       - DATABASE_URL  (Prisma DB connection)
       - NEXTAUTH_URL  (https://your-production-domain)
       - NEXTAUTH_SECRET
       - Any OAuth client IDs/secrets (e.g. GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
     Note: Do NOT paste production secrets into source files. Use the dashboard's Environment Variables UI.
  5. If your build runs Prisma migrations during build (this repo's package.json build script runs `prisma migrate deploy`), make sure the DB is reachable from Vercel during builds or move migrations to a controlled CI step or run them manually.
  6. Click Deploy.

B) Vercel CLI (if you prefer manual deploys)
  1. Install the CLI locally: npm i -g vercel
  2. Login locally: vercel login
     - Or set VERCEL_TOKEN locally as an environment variable (only on your machine), then run: vercel --token "$VERCEL_TOKEN"
  3. From repo root, run: vercel --prod --confirm
  4. Ensure the same Environment Variables are set in the Vercel Project Settings (or use the CLI to set them for the project).

Notes & troubleshooting
-----------------------
- The repo's build script runs:
    prisma migrate deploy && prisma generate && next build
  That requires a reachable DATABASE_URL at build time. If the DB isn't reachable, the build will fail. Recommended approaches:
    - Run migrations outside of Vercel (manually or via a CI job) and remove migrations from the build step; OR
    - Provide a staging/CI-visible DATABASE_URL as an environment variable in Vercel so migrations can run during build.
- If you use a custom domain, add it in the Vercel dashboard -> Domains and follow the DNS instructions.

If you'd like me to:
- Create additional vercel configuration (rewrites/redirects) in vercel.json — say what you need.
- Add a GitHub Action or CI job to run migrations separately (I can scaffold it).

Next step recommended now
-------------------------
1) Revoke the exposed token in Vercel immediately and create a new one.
2) Confirm whether you want the repo pushed to GitHub and connected to Vercel (I can add vercel.json and deployment notes — already done).

