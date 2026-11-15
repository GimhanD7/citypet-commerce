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

## Deploy to Namecheap (`citypet.kasunwalakumbura.com`) via GitHub Actions

Pushing to `main` (or running the workflow manually) triggers [`.github/workflows/build.yml`](.github/workflows/build.yml), which builds the frontend for `https://citypet.kasunwalakumbura.com/`, checks PHP syntax, and deploys to Namecheap over SFTP (port `21098`).

### 1. Namecheap cPanel Setup

1. **Create Subdomain**:
   - In **cPanel → Domains → Create A New Domain**, enter `citypet.kasunwalakumbura.com` (uncheck "Share document root" so its document root is `citypet.kasunwalakumbura.com`, or note the document root path you choose).
2. **Enable SSH & Authorize Key**:
   - In Namecheap **cPanel → Exclusive for Namecheap Customers → Manage Shell** (or **SSH Access**), enable SSH access (port `21098`).
   - Go to **SSH Access → Manage SSH Keys → Generate a New Key** (or **Import Key**), click **Manage** next to your public key, and click **Authorize**.
   - Download/copy the **Private Key** for GitHub Secrets.
3. **Create MySQL Database**:
   - In **cPanel → MySQL® Databases**, create a database (e.g. `cpaneluser_citypet`) and a MySQL user (e.g. `cpaneluser_admin`), then add the user to the database with **ALL PRIVILEGES**.
   - In **cPanel → phpMyAdmin**, select your new database and import [`api/database/schema.sql`](api/database/schema.sql) and [`api/database/product_features.sql`](api/database/product_features.sql) (remove or adjust the top `CREATE DATABASE` / `USE` lines in `schema.sql` so it imports into your cPanel-prefixed database).

### 2. GitHub Repository Variables & Secrets

In your GitHub repository, open **Settings → Secrets and variables → Actions**:

**Variables (or Secrets):**
| Name | Example Value | Notes |
| :--- | :--- | :--- |
| `SFTP_HOST` | `citypet.kasunwalakumbura.com` (or Namecheap server hostname) | Namecheap server hostname |
| `SFTP_USER` | `cpaneluser` | Your Namecheap cPanel username |
| `SFTP_PORT` | `21098` | Optional (defaults to `21098`) |
| `SFTP_TARGET` | `citypet.kasunwalakumbura.com` | Document root for the subdomain in cPanel (or `public_html/citypet` if configured there) |
| `DB_HOST` | `localhost` | Optional (defaults to `localhost`) |
| `DB_NAME` | `cpaneluser_citypet` | Namecheap MySQL database name |
| `DB_USER` | `cpaneluser_admin` | Namecheap MySQL username |

**Secrets:**
| Name | Value | Notes |
| :--- | :--- | :--- |
| `SFTP_PRIVATE_KEY` | Full contents of your private SSH key (`-----BEGIN ...`) | Required |
| `SFTP_KEY_PASSPHRASE` | Passphrase for your SSH key | Optional (only needed if your key has a passphrase) |
| `DB_PASS` | Your MySQL user password | Injects `api/config/env.local.php` during deploy |
| `SFTP_KNOWN_HOSTS` | Output of `ssh-keyscan -p 21098 your-host` | Optional (auto-fetched via `ssh-keyscan` if omitted) |

### 3. Deploy & Verify

1. Push to `main` (or go to **Actions → Build and deploy CityPet (Namecheap) → Run workflow**).
2. Visit `https://citypet.kasunwalakumbura.com/` and verify `https://citypet.kasunwalakumbura.com/api/health.php` reports `"database": "connected"`.

## Important content note

The contact details, doctor names, service list and opening hours were reconstructed from the existing public City Pet website during the redesign. Verify operational details before production deployment.

## Asset note

The included dog/cat brand mark was reconstructed from the existing City Pet visual branding reference available online. If the hospital has the original high-resolution official logo (SVG/PNG), replace `src/assets/citypet-logo-mark.png` with that source file for perfect brand fidelity.

### Password reset delivery

Configure the following server environment variables for PHP.

- PASSWORD_RESET_FROM_EMAIL is the address permitted to send mail through the host's PHP mail transport.
- TEXTLK_API_TOKEN is the Text.lk API token.
- TEXTLK_SENDER_ID is the approved Text.lk sender ID.

Enable PHP cURL and configure PHP mail delivery on the hosting server. The reset flow uses the account's stored email and phone number.
