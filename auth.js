/* ================================================================
   IMPACTGRID AUTH — auth.js
   Forces login on every protected page. No session = login.html.
   Waits for supabase.js to finish initialising before running.
================================================================ */

/* Logout defined immediately so the sidebar button always works */
window.logout = async function () {
  try {
    if (window.supabaseClient) await window.supabaseClient.auth.signOut();
  } catch (e) {}
  window.location.href = 'login.html';
};

/* Wait for the Supabase client to be ready, THEN run auth */
window.supabaseReady.then(function (supabase) {

  /* Listen for sign-out / token refresh events */
  supabase.auth.onAuthStateChange(function (event) {
    if (event === 'SIGNED_OUT') {
      window.location.href = 'login.html';
    }
    if (event === 'TOKEN_REFRESHED') {
      console.log('[ImpactGrid] Session token refreshed.');
    }
  });

  checkAuth(supabase);
});

async function checkAuth(supabase) {
  try {
    var result = await supabase.auth.getSession();
    var session = result.data && result.data.session;
    var error   = result.error;

    if (error) {
      console.error('[ImpactGrid] Session error:', error.message);
      window.location.href = 'login.html';
      return;
    }

    if (!session) {
      window.location.href = 'login.html';
      return;
    }

    console.log('[ImpactGrid] Authenticated:', session.user.email);

  } catch (err) {
    console.error('[ImpactGrid] Auth check failed:', err);
    window.location.href = 'login.html';
  }
}
