This folder holds GitHub Actions workflows. The CI & Deploy workflow (ci-deploy.yml) runs Prisma migrations and deploys to Vercel on push to main. Ensure these repository secrets are set in GitHub settings before using the workflow:

- DATABASE_URL (required for migrations)
- VERCEL_TOKEN (required for Vercel CLI deploy)

Optional:
- NEXTAUTH_SECRET
- Any OAuth client secrets (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.)
