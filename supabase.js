/* ================================================================
   IMPACTGRID — SUPABASE CLIENT
   DO NOT MODIFY THIS FILE
================================================================ */

(function() {
  var SUPABASE_URL = 'https://vopehiqnduxobtaamrnh.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_oPR-GdRq7Rz3RvBepMkVQw_b7R6ocA3';

  /* Wait for the Supabase library to be available */
  function initClient() {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log('[ImpactGrid] Supabase client ready');
    } else {
      /* Retry after a short delay if library not yet loaded */
      setTimeout(initClient, 50);
    }
  }

  initClient();
})();
