# City Pet Animal Hospital — Modern Frontend Redesign

Frontend-only React/Vite website concept for City Pet Animal Hospital.

## Included

- Responsive desktop, tablet and mobile UI
- Custom City Pet brand mark treatment based on the existing visual identity
- Original doctor photos from the current City Pet website
- About, doctors, services, mobile-service areas, locations, opening hours and contact sections
- No appointment flow, login, database or backend
- Custom CSS pet illustration and lightweight animations
- Reduced-motion accessibility support
- SEO/meta tags

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The build output will be created in `dist/`.

## Deploy to private staging

Push the repository to GitHub. The **Build and deploy CityPet** workflow builds the frontend for `/citypet/` and checks PHP syntax on pushes and pull requests to `main`.

1. On a private staging host with PHP, `pdo_mysql`, and MySQL, create the web directory for `/citypet/` and give the SFTP account write access. Configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASS` in the host's PHP environment. For a new database, import [schema.sql](api/database/schema.sql) into the database assigned by your host. Adjust its initial `CREATE DATABASE` and `USE` statements for that database and your account permissions.
2. In the GitHub repository's **Settings → Secrets and variables → Actions**, add the variables `SFTP_HOST`, `SFTP_USER`, and `SFTP_TARGET` (for example, `public_html/citypet`). Set `SFTP_PORT` if your host uses a port other than 22.
3. Add the repository secrets `SFTP_PRIVATE_KEY` and `SFTP_KNOWN_HOSTS`. Authorize the matching public key on the host and use the host's verified SSH host key in OpenSSH known_hosts format.
4. Go to **Actions → Build and deploy CityPet → Run workflow**, select `main`, and check **Upload to private staging over SFTP**.
5. After deployment, visit `/citypet/` and confirm that `/citypet/api/health.php` reports the database as connected.

The upload updates frontend and API code in place. Database setup and uploaded media are managed on the host. Keep staging private while the API accepts the fixed demo login code.

## Important content note

The contact details, doctor names, service list and opening hours were reconstructed from the existing public City Pet website during the redesign. Verify operational details before production deployment.

## Asset note

The included dog/cat brand mark was reconstructed from the existing City Pet visual branding reference available online. If the hospital has the original high-resolution official logo (SVG/PNG), replace `src/assets/citypet-logo-mark.png` with that source file for perfect brand fidelity.
