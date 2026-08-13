(function () {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload = () => {
    if (!window.KARAK_SUPABASE_URL || window.KARAK_SUPABASE_URL.includes('YOUR-PROJECT') ||
        !window.KARAK_SUPABASE_ANON_KEY || window.KARAK_SUPABASE_ANON_KEY.includes('YOUR_SUPABASE')) {
      console.warn('Karak Station: Supabase is not configured. Add values in js/supabase-config.js.');
      return;
    }
    window.karakSupabase = window.supabase.createClient(window.KARAK_SUPABASE_URL, window.KARAK_SUPABASE_ANON_KEY);
    window.dispatchEvent(new Event('karak-supabase-ready'));
  };
  document.head.appendChild(script);
})();
