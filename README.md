# Portfolio

## Owner admin

The private editor is available at `/admin/`. It manages project entries, profile and contact details, skills, badges, and achievements. Saving in Decap CMS commits the content to the `main` branch; Vercel then rebuilds the public site.

### One-time Vercel and GitHub setup

1. Deploy this repository to Vercel and make `https://kathlene-fernandez.vercel.app` the production domain. If Vercel assigns a different domain, update `base_url` in `public/admin/config.yml` and use that same origin for `SITE_URL`.
2. Create a GitHub OAuth App. Set its homepage to the production site origin and its callback URL to `https://kathlene-fernandez.vercel.app/api/callback` (or the matching production domain).
3. Add these environment variables to the Vercel project:
   - `GITHUB_CLIENT_ID`: OAuth App client ID
   - `GITHUB_CLIENT_SECRET`: OAuth App client secret
   - `SITE_URL`: production origin, for example `https://kathlene-fernandez.vercel.app` (no path)
4. Redeploy after setting the variables. Open `/admin/` and sign in with a GitHub account that can push to this repository.

The sign-in flow requests GitHub's `public_repo` permission, so the repository must be public. The OAuth secret belongs only in Vercel environment variables; never commit it to the repository.

### Editing locally

`public/admin/config.yml` enables Decap's local backend. In one terminal run `npx decap-server`, then start the Astro development server and open `/admin/`. Local CMS changes are written to the working tree; they do not update the deployed site until committed and pushed.

Uploaded CMS media is saved in `public/uploads/`. The resume field can upload a replacement file there; the existing `/resume.pdf` remains available until replaced.
