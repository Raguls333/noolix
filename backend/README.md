# NOOLIX Backend

Run: npm install && npm run seed && npm run dev

## CI/CD

GitHub Actions workflows live in `.github/workflows/` and deploy on branch pushes:
- `develop` -> development
- `staging` -> staging
- `main` -> production

Backend deploy triggers Render via `.github/workflows/backend-deploy.yml`.
Required secrets in GitHub:
- `RENDER_DEPLOY_HOOK_DEV`, `RENDER_DEPLOY_HOOK_STAGING`, `RENDER_DEPLOY_HOOK_PROD`
