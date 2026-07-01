# JAYTRIX VPS Deployment

This checklist is for deploying JAYTRIX Systems Marketplace on a Linux VPS with Nginx, Node.js, MariaDB, and HTTPS.

## 1. Server Packages

```bash
sudo apt update
sudo apt install -y nginx mariadb-server git curl certbot python3-certbot-nginx
node -v
npm -v
```

Use Node.js 20 LTS or newer for production.

## 2. App Directory

```bash
sudo mkdir -p /var/www/jaytrix
sudo chown -R $USER:www-data /var/www/jaytrix
git clone <your-repo-url> /var/www/jaytrix
cd /var/www/jaytrix
npm install
npm install --prefix client
npm install --prefix server
```

## 3. Environment

Create `server/.env` on the VPS. Do not commit real secrets.

Required production values:

```env
NODE_ENV=production
PORT=5001
JWT_SECRET=replace_with_long_random_secret
DATABASE_URL=mariadb://USER:PASSWORD@127.0.0.1:3306/ecommerce
DB_SYNC=false
DB_SYNC_ALTER=false
CLIENT_URL=https://example.com
CLIENT_URLS=https://example.com,https://www.example.com
SNIPPE_WEBHOOK_URL=https://example.com/api/payments/snippe/webhook
NOTIFICATION_INSTANCE_ID=backend-1
```

Also configure Cloudinary, SMTP, Snippe, and Meseji credentials from `server/.env.example`.

## 4. Database

```bash
sudo mariadb
```

```sql
CREATE DATABASE ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'jaytrix_user'@'localhost' IDENTIFIED BY 'replace_with_strong_password';
GRANT ALL PRIVILEGES ON ecommerce.* TO 'jaytrix_user'@'localhost';
FLUSH PRIVILEGES;
```

Then run:

```bash
cd /var/www/jaytrix/server
npm run migrate
npm test
```

## 5. Build Frontend

```bash
cd /var/www/jaytrix/client
npm run build
```

The production frontend lives at `client/dist`.

## 6. Systemd API Service

Copy and edit the example:

```bash
sudo cp /var/www/jaytrix/deploy/systemd/jaytrix-api.service.example /etc/systemd/system/jaytrix-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now jaytrix-api
sudo systemctl status jaytrix-api
```

Logs:

```bash
journalctl -u jaytrix-api -f
```

## 7. Nginx

Copy and edit domain names:

```bash
sudo cp /var/www/jaytrix/deploy/nginx/jaytrix-marketplace.conf.example /etc/nginx/sites-available/jaytrix-marketplace
sudo ln -s /etc/nginx/sites-available/jaytrix-marketplace /etc/nginx/sites-enabled/jaytrix-marketplace
sudo nginx -t
sudo systemctl reload nginx
```

Enable HTTPS:

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

## 8. Post-Deploy Smoke Test

```bash
cd /var/www/jaytrix/server
SMOKE_BASE_URL=https://example.com \
SMOKE_ADMIN_EMAIL=admin@example.com \
SMOKE_ADMIN_PASSWORD='replace_admin_password' \
SMOKE_RUN_PAYMENT=false \
npm run smoke:postdeploy
```

For a live payment test, use a low-value product that Snippe accepts, then set `SMOKE_RUN_PAYMENT=true`.

## Production Notes

- Keep `DB_SYNC=false` in production and use migrations only.
- Point Snippe webhook to the public HTTPS backend URL.
- Use strong admin passwords and rotate any local placeholder credentials.
- Confirm `CLIENT_URLS` contains every allowed frontend domain.
- Keep `sw.js` uncached in Nginx so PWA updates roll out cleanly.
