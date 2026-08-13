# Blog + Special Poster Supabase Migration

This version connects Blog Admin and Special Poster Admin to Supabase.

## Tables used
- `blog_categories`
- `blog_posts`
- `special_foods`

The existing `supabase-schema.sql` already contains these tables, RLS, public read policies, and admin write policies.

## What changed
- Blog Admin reads/writes through `KarakDB.getBlog()` / `KarakDB.saveBlog()`.
- Special Poster Admin reads/writes through `KarakDB.getSpecialFoods()` / `KarakDB.saveSpecialFoods()`.
- If Supabase is empty but legacy localStorage data exists, the admin page performs a one-time migration to Supabase.
- Public Blog page and homepage recent blog section read from Supabase.
- Homepage Special Poster reads `special_foods` from Supabase.
- Admin dashboard Blog/Special Poster counts read from Supabase.

## Important
Keep the working `js/supabase-config.js` values in this project. Use only the public/publishable (anon) key in frontend files; never put a service-role/secret key in the website.
