/* ================================================================
   IMPACTGRID — SUPABASE CLIENT  (DO NOT MODIFY)
================================================================ */
(function () {
  var SUPABASE_URL = 'https://vopehiqnduxobtaamrnh.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_oPR-GdRq7Rz3RvBepMkVQw_b7R6ocA3';

  function tryInit() {
    /* supabase global is set by the CDN script */
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
      try {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          }
        });
        console.log('[ImpactGrid] Supabase ready');
      } catch (e) {
        console.error('[ImpactGrid] Supabase createClient failed:', e);
      }
    } else {
      setTimeout(tryInit, 80);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }
})();
