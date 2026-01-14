
  # Noolix client

  This is a code bundle for Noolix client. The original project is available at https://www.figma.com/design/oGfQVuNYkuk2oj1vp7Jnoh/Noolix-client.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
## Backend API integration (local)

This UI is wired to call the NOOLIX backend under `/api/...`.

### Expected backend
- Backend running on: `http://localhost:8080`
- All routes mounted under: `/api/{routeName}`

### Frontend dev
1) Install
```bash
npm install
```
2) Start
```bash
npm run dev
```

The included `vite.config.ts` proxies `/api` to `http://localhost:8080`, so the frontend can simply call `/api/...` without CORS.

### API client
See `src/api/*` for a centralized, reusable API layer (auth, clients, commitments, reports, exports, public token flows).

Set `VITE_API_BASE_URL` only if you want to point to a deployed backend. Otherwise leave it empty and use the proxy.

## CI/CD

GitHub Actions workflows live in `.github/workflows/` and deploy on branch pushes:
- `develop` -> development
- `staging` -> staging
- `main` -> production

Frontend deploy uses Netlify via `.github/workflows/frontend-deploy.yml`.
Required secrets in GitHub:
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID_DEV`, `NETLIFY_SITE_ID_STAGING`, `NETLIFY_SITE_ID_PROD`
- `VITE_API_BASE_URL_DEV`, `VITE_API_BASE_URL_STAGING`, `VITE_API_BASE_URL_PROD`
