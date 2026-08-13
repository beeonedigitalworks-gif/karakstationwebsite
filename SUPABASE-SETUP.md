# Karak Station — Supabase conversion

The project now includes a Supabase data layer and a migration bridge. The existing public/admin UI is preserved while persistent application data can be shared between browsers.

## 1. Create the Supabase project

Create a new Supabase project, then open **SQL Editor**.

Run the complete file:

`supabase-schema.sql`

## 2. Configure the website

Open:

`js/supabase-config.js`

Replace:

- `https://YOUR-PROJECT.supabase.co`
- `YOUR_SUPABASE_ANON_KEY`

Use the project's **anon/public** key only. Never put a `service_role` key in website files.

## 3. Create the admin account

Use **Supabase Dashboard → Authentication → Users** to create the administrator account.

The current admin login box keeps the old username-style UI. If you enter `rashid313`, the converted code signs in as:

`rashid313@karakstation.local`

For a real email account, you can also enter the complete email address directly.

After creating the Auth user, copy its user UUID and run:

```sql
insert into public.admin_profiles (id, username, role)
values ('AUTH-USER-UUID-HERE', 'RASHID313', 'super_admin')
on conflict (id) do update set username = excluded.username, role = excluded.role;
```

If email confirmation is enabled, confirm the account before logging in.

## 4. Migrate old browser data

If the old Karak Station site has data stored in the browser's localStorage, open:

`supabase-migration.html`

**on the same browser/profile that contains the old data**, then click **Migrate local data**.

This uploads the legacy menu, blog, special-food, WhatsApp settings and order cache into the Supabase compatibility store.

## 5. Deploy

The project remains static-hosting friendly. It can be deployed to GitHub Pages, Netlify, Vercel, or another static host.

## Database architecture

- `categories` — menu categories
- `foods` — normal menu items
- `special_foods` — special-poster foods
- `blog_categories` — blog categories
- `blog_posts` — blog content
- `orders` — customer orders
- `site_settings` — WhatsApp/site configuration
- `admin_profiles` — Supabase Auth users allowed into the admin
- `app_store` — transitional compatibility layer for the existing UI
- `karak-images` — Supabase Storage bucket for future uploaded images

## Important security change

The hard-coded admin password that existed in the original project has been removed. Admin authentication now uses Supabase Auth.

For production, the next cleanup step is to remove the transitional `app_store` usage page-by-page and have every admin form write directly to the normalized Supabase tables. The schema and database adapter needed for that final migration are already included.


## Manage Orders v4
Use `admin/manage-orders-v4.html` from the authenticated Admin Dashboard.
