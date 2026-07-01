# JAYTRIX Systems

JAYTRIX Systems is a multi-vendor marketplace and delivery platform built for shoppers, vendors, riders, and modern retail operations.

## Stack

- Frontend: React, TailwindCSS
- Backend: Node.js, Express.js
- Database: MariaDB (Sequelize ORM)
- Auth: JWT (role-based)
- Media: Cloudinary

## Core Features

- Shopper and vendor registration with phone capture
- Vendor storefront and product management
- Vendor products publish immediately to avoid admin bottlenecks
- Order lifecycle: `pending -> paid -> out_for_delivery -> delivered/cancelled/refunded`
- Rider assignment and timeout re-assignment job
- Vendor-managed riders, rider bonuses, and rider settlement tracking
- Vendor payout queue with customer dispute/review window protection
- Realtime in-app notifications and optional Meseji WhatsApp delivery
- Admin dashboard metrics, audit logs, and marketplace operations controls

## Project Structure

- `client/` - frontend app
- `server/` - backend API

## Backend Setup (MariaDB)

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment

Copy `server/.env.example` to `server/.env`, then update values:

```env
NODE_ENV=development
PORT=5001
JWT_SECRET=replace_with_a_long_random_secret_min_32_chars

DATABASE_URL=mariadb://root:your_mysql_password@127.0.0.1:3306/ecommerce
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=ecommerce
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_SYNC=false
DB_SYNC_ALTER=false

CLOUDINARY_NAME=replace_with_cloudinary_cloud_name
CLOUDINARY_API_KEY=replace_with_cloudinary_api_key
CLOUDINARY_API_SECRET=replace_with_cloudinary_api_secret
APP_NAME=JAYTRIX Systems
MAIL_FROM=JAYTRIX Systems <no-reply@jaytrix.co.tz>
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
CLIENT_URL=http://localhost:5173
CLIENT_URLS=http://localhost:5173,http://127.0.0.1:5173
```

### 3. Prepare database

i already created:

- `users`
- `products`
- `orders`
- `order_items`

Run migrations explicitly:

```bash
cd server
npm run migrate
```

Check migration status:

```bash
cd server
npm run migrate:status
```

`DB_SYNC` is now intended only as a local fallback for development. In production, keep `DB_SYNC=false` and use migrations instead of `sequelize.sync`.

### 4. Start backend

```bash
cd server
npm start
```

Backend default URL: `http://localhost:5001`

### 5. Bootstrap local test accounts

```bash
cd server
npm run create-admin
npm run create-rider
npm run create-test-order
```

Default local credentials:

- Admin: `admin@jaytrix.test` / value from `ADMIN_PASSWORD`
- Rider: `rider@jaytrix.test` / value from `RIDER_PASSWORD`
- Test customer: `customer@jaytrix.test` / value from `TEST_CUSTOMER_PASSWORD`

## Frontend Setup

Copy `client/.env.example` to `client/.env`, then start the app:

```bash
cd client
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

## Main API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `POST /api/orders`
- `PUT /api/orders/:id/pay`
- `PUT /api/orders/:id/status` (admin)
- `GET /api/rider/orders`
- `PUT /api/rider/orders/:id/accept`
- `PUT /api/rider/orders/:id/reject`
- `PUT /api/rider/orders/:id/delivered`
- `GET /api/admin/dashboard`
- `GET /api/admin/audit`
- `GET /api/admin/messaging-settings`
- `PATCH /api/admin/messaging-settings`
- `GET /api/admin/messaging-settings/sms-stats`
- `POST /api/admin/notifications/:id/retry-external`
- `GET /api/vendor/orders`
- `PATCH /api/vendor/orders/:id/rider-bonus`
- `GET /api/vendor/riders/earnings`
- `POST /api/payments/snippe/webhook`

## Snippe Mobile Money

Set these backend env vars before enabling `mobile_money` payments:

```env
SNIPPE_API_KEY=your_snippe_api_key
SNIPPE_BASE_URL=https://api.snippe.sh
SNIPPE_WEBHOOK_SECRET=your_snippe_webhook_secret
SNIPPE_WEBHOOK_URL=https://your-backend-domain/api/payments/snippe/webhook
PAYOUT_DISPUTE_WINDOW_HOURS=24
RIDER_DELIVERY_EARNING=3000
RIDER_BONUS_MAX_AMOUNT=50000
NOTIFICATION_INSTANCE_ID=backend-1
NOTIFICATION_RELAY_INTERVAL_MS=2000
NOTIFICATION_EVENT_CLEANUP_INTERVAL_MS=600000
NOTIFICATION_EVENT_RETENTION_HOURS=24
NOTIFICATION_EXTERNAL_CHANNELS=
NOTIFICATION_EXTERNAL_TYPES=customer_payment_pending,customer_payment_completed,customer_payment_issue,customer_order_status,customer_delivery_issue_update,rider_payment_settled,rider_payment_reopened,rider_bonus_updated
MESEJI_WHATSAPP_ENABLED=false
MESEJI_BASE_URL=https://api.meseji.app
MESEJI_API_TOKEN=replace_with_meseji_api_token
MESEJI_WHATSAPP_FROM=replace_with_meseji_phone_number_id
MESEJI_SMS_ENABLED=false
MESEJI_TZ_BASE_URL=https://meseji.co.tz/api/v1
MESEJI_TZ_API_KEY=replace_with_meseji_tz_api_key
MESEJI_SMS_SENDER_ID=MESEJI
```

Flow:

- Checkout creates the order and requests a Snippe mobile money push.
- Customer confirms the USSD prompt on phone.
- Snippe calls `POST /api/payments/snippe/webhook`.
- Backend verifies the signature and marks the order paid.
- Notification SSE streams update connected customer/admin browsers in realtime.

Realtime notification notes:

- Set a unique `NOTIFICATION_INSTANCE_ID` per backend instance.
- `notification_events` acts as a MariaDB outbox so multi-instance deployments can relay notification events across instances.
- Old outbox rows are cleaned up automatically based on `NOTIFICATION_EVENT_RETENTION_HOURS`.
- External WhatsApp/SMS delivery is off until Meseji credentials are configured and admin enables the channel in Admin Notifications.
- Admin can retry skipped/failed external deliveries from the Notifications page without creating a duplicate in-app notification.
- Meseji Tanzania SMS uses `POST /sms/send` on `https://meseji.co.tz/api/v1` with the `x-api-key` header.
- Admin Notifications can also check Meseji SMS balance and delivery health through `GET /sms/user-stats`.

## Marketplace Operations

- Vendors can create their own riders and manage rider status from the vendor dashboard.
- Vendors can add delivery bonuses per order; rider base pay comes from `RIDER_DELIVERY_EARNING`, and bonus limits are controlled by `RIDER_BONUS_MAX_AMOUNT`.
- Rider payments are a vendor/rider settlement matter. Vendors can mark rider jobs paid and add settlement notes.
- Vendor payouts are protected by `PAYOUT_DISPUTE_WINDOW_HOURS`. Delivered orders stay on hold until the customer review/dispute window has passed.
- Admin no longer needs to approve every vendor product before it appears; admin still keeps moderation power through product rejection and operations audit logs.

Local webhook smoke test:

```bash
cd server
npm run test-snippe-webhook -- 123 5000
```

This sends a signed local `payment.completed` webhook for order `123` and amount `5000`.

## Deploy (Render - Backend)

For VPS hosting with Nginx, systemd, MariaDB, and HTTPS, see [`docs/VPS_DEPLOYMENT.md`](docs/VPS_DEPLOYMENT.md).

Set:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

Required env vars on Render:

- `NODE_ENV=production`
- `JWT_SECRET=...`
- `CLIENT_URL=https://your-frontend-domain`
- `DATABASE_URL=mariadb://USER:PASSWORD@HOST:3306/DBNAME`
- `CLOUDINARY_NAME=...`
- `CLOUDINARY_API_KEY=...`
- `CLOUDINARY_API_SECRET=...`
- `MAIL_FROM=...`
- `SMTP_HOST=...`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=...`
- `SMTP_PASS=...`
- `PAYOUT_DISPUTE_WINDOW_HOURS=24`
- `RIDER_DELIVERY_EARNING=3000`
- `RIDER_BONUS_MAX_AMOUNT=50000`

Recommended notification env vars on multi-instance deploys:

- `NOTIFICATION_INSTANCE_ID=backend-1`
- `NOTIFICATION_RELAY_INTERVAL_MS=2000`
- `NOTIFICATION_EVENT_CLEANUP_INTERVAL_MS=600000`
- `NOTIFICATION_EVENT_RETENTION_HOURS=24`
- `NOTIFICATION_EXTERNAL_CHANNELS=meseji_whatsapp,meseji_sms`
- `NOTIFICATION_EXTERNAL_TYPES=customer_payment_pending,customer_payment_completed,customer_payment_issue,customer_order_status,customer_delivery_issue_update,rider_payment_settled,rider_payment_reopened,rider_bonus_updated`
- `MESEJI_WHATSAPP_ENABLED=false`
- `MESEJI_BASE_URL=https://api.meseji.app`
- `MESEJI_API_TOKEN=...`
- `MESEJI_WHATSAPP_FROM=...`
- `MESEJI_SMS_ENABLED=false`
- `MESEJI_TZ_BASE_URL=https://meseji.co.tz/api/v1`
- `MESEJI_TZ_API_KEY=...`
- `MESEJI_SMS_SENDER_ID=MESEJI`

Production checklist:

1. Set backend env vars, especially `JWT_SECRET`, `DATABASE_URL`, Snippe vars, SMTP vars, and a unique `NOTIFICATION_INSTANCE_ID`.
2. Run migrations with `cd server && npm run migrate`.
3. Verify the configured admin can log in.
4. Open admin dashboard and confirm `Notification Health` is loading.
5. Run the post-deploy smoke script below.

Post-deploy smoke script:

Safe smoke checks only:

```bash
cd server
SMOKE_BASE_URL=https://your-backend-domain npm run smoke:postdeploy
```

With admin checks:

```bash
cd server
SMOKE_BASE_URL=https://your-backend-domain \
SMOKE_ADMIN_EMAIL=admin@jaytrix.co.tz \
SMOKE_ADMIN_PASSWORD='your-admin-password' \
npm run smoke:postdeploy
```

Optional payment smoke:

- This creates a real order.
- It may trigger a real mobile money prompt to the phone you provide.
- Use only with a controlled test product and test phone.

```bash
cd server
SMOKE_BASE_URL=https://your-backend-domain \
SMOKE_RUN_PAYMENT=true \
SMOKE_PRODUCT_ID=123 \
SMOKE_PHONE=0683186987 \
SMOKE_PAYMENT_NETWORK=airtel_money \
npm run smoke:postdeploy
```

Optional webhook completion after payment smoke:

```bash
cd server
SMOKE_BASE_URL=https://your-backend-domain \
SMOKE_RUN_PAYMENT=true \
SMOKE_RUN_WEBHOOK=true \
SMOKE_PRODUCT_ID=123 \
SMOKE_PHONE=0683186987 \
SMOKE_PAYMENT_NETWORK=airtel_money \
SNIPPE_WEBHOOK_SECRET='your-webhook-secret' \
npm run smoke:postdeploy
```

## Notes by JAYFOUR

- Do not commit real secrets in `.env`.
- Keep `server/.env` ignored in git.
- Local uploads are stored in `server/uploads/` when Cloudinary is not configured.
- Account recovery is currently handled through JAYTRIX support until the secure recovery flow is enabled.
