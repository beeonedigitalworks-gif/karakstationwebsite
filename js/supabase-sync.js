/*
 * Transitional Supabase persistence bridge.
 * Existing UI code can continue calling localStorage, but persistent application
 * data is mirrored to Supabase app_store so it is shared between devices.
 * This file also hydrates the browser cache from Supabase on first load.
 */
(function () {
  const DATA_KEYS = new Set([
    'adminMenu','adminCategories','adminFoods','blogCategories','blogPosts',
    'specialPosterFoods','karakSubmittedOrders','whatsappOrderCount',
    'specialPosterWhatsAppOrderCount','karakWhatsAppOrderSettings',
    'karakWhatsAppBookingSettings','manageOrdersShopWhatsApp','whatsappPendingUpdates'
  ]);
  const SKIP_SYNC = new Set(['adminUser']);
  let ready = false;
  let hydrating = false;
  const originalSet = Storage.prototype.setItem;
  const originalRemove = Storage.prototype.removeItem;

  function parse(value) { try { return JSON.parse(value); } catch (_) { return value; } }
  function supabaseReady() { return !!window.karakSupabase; }

  async function push(key, value) {
    if (!ready || hydrating || !supabaseReady() || !DATA_KEYS.has(key) || SKIP_SYNC.has(key)) return;
    try {
      await window.karakSupabase.from('app_store').upsert({ key, value: parse(value), updated_at: new Date().toISOString() });
    } catch (e) { console.warn('Supabase sync failed for', key, e); }
  }

  Storage.prototype.setItem = function (key, value) {
    const result = originalSet.call(this, key, value);
    if (this === window.localStorage) push(String(key), String(value));
    return result;
  };
  Storage.prototype.removeItem = function (key) {
    const result = originalRemove.call(this, key);
    if (this === window.localStorage && DATA_KEYS.has(String(key)) && ready && !hydrating && supabaseReady()) {
      window.karakSupabase.from('app_store').delete().eq('key', String(key)).then(({error}) => { if (error) console.warn(error); });
    }
    return result;
  };

  async function hydrate() {
    if (!supabaseReady()) return;
    hydrating = true;
    try {
      const { data, error } = await window.karakSupabase.from('app_store').select('key,value,updated_at');
      if (error) throw error;
      let changed = false;
      (data || []).forEach(row => {
        if (!DATA_KEYS.has(row.key)) return;
        const incoming = JSON.stringify(row.value);
        const local = window.localStorage.getItem(row.key);
        if (local !== incoming) {
          originalSet.call(window.localStorage, row.key, incoming);
          changed = true;
        }
      });
      ready = true;
      window.dispatchEvent(new CustomEvent('karak-data-ready', { detail: { changed } }));
      // On a clean/new browser, reload once so the existing synchronous UI reads hydrated data.
      if (changed && !sessionStorage.getItem('karakSupabaseHydrated')) {
        sessionStorage.setItem('karakSupabaseHydrated', '1');
        location.reload();
      }
    } catch (e) {
      console.warn('Supabase hydration failed:', e);
      ready = true;
      window.dispatchEvent(new CustomEvent('karak-data-ready', { detail: { changed: false, error: e } }));
    } finally { hydrating = false; }
  }

  function start() {
    if (supabaseReady()) hydrate();
    else window.addEventListener('karak-supabase-ready', hydrate, { once: true });
  }
  start();
})();
