# Deploy Smart Expiry Notifications

## Step 1 — Run the migration in Supabase Dashboard

1. Go to **supabase.com/dashboard** → your project → **SQL Editor**
2. Paste and run the contents of `migrations/006_expiry_notifications.sql`

This will:
- Enable `pg_cron` and `pg_net` extensions
- Fix the `notifications` table constraints to allow `in_app` channel + `expiry_90d` type
- Create the `generate_expiry_notifications()` SQL function
- Schedule it to run **every day at 9:00 AM UTC** via pg_cron

## Step 2 — Deploy the Edge Function (optional but recommended)

```bash
cd warranty-vault
npx supabase login
npx supabase link --project-ref gikwflwrlgltijamuqqc
npx supabase functions deploy notify-expiring-warranties
```

## Step 3 — Test manually

### Option A: Run SQL directly in Supabase SQL Editor
```sql
SELECT public.generate_expiry_notifications();
```

### Option B: Call the Edge Function via curl
```bash
curl -X POST https://gikwflwrlgltijamuqqc.supabase.co/functions/v1/notify-expiring-warranties \
  -H "Authorization: Bearer <your-anon-key>"
```

## How it works

| Trigger       | Action                                                  |
|---------------|---------------------------------------------------------|
| pg_cron daily | Calls `generate_expiry_notifications()` at 9 AM UTC    |
| SQL function  | Finds warranties expiring in 0/1/7/30/90 days           |
| Deduplication | Skips if same warranty+type already notified today      |
| Real-time     | Supabase Realtime pushes new rows to the notification bell instantly |

## Notification types generated

| Days until expiry | Type          | Example message                                 |
|-------------------|---------------|-------------------------------------------------|
| 90 days           | `expiry_90d`  | "Samsung TV (Samsung) expires in 90 days."     |
| 30 days           | `expiry_30d`  | "MacBook (Apple) expires in 30 days."          |
| 7 days            | `expiry_7d`   | "iPhone (Apple) expires in 7 days. Act now!"  |
| 1 day             | `expiry_1d`   | "Sony PS5 expires tomorrow. File a claim!"    |
| Today             | `expiry_today`| "Dell XPS expires TODAY! Last chance."        |
