# Karak Station — Supabase Core Data Cleanup

The core live data flow is now Supabase-first/direct:

- categories -> `categories`
- foods -> `foods`
- food images -> Supabase Storage
- customer orders -> `orders`
- admin authentication -> Supabase Auth + `admin_profiles`
- menu page reads categories/foods directly from Supabase
- admin menu saves directly to Supabase

The transitional `supabase-sync.js` app_store/localStorage bridge has been removed from the core pages.

Browser storage may still be used by legacy/non-core features such as blog/special-poster UI settings and admin navigation/session compatibility. Those should be migrated separately and tested before deletion.
