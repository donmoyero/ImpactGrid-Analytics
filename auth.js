/* ================================================================
   IMPACTGRID AUTH — auth.js
   Forces login on every page load. No session = login.html.
================================================================ */
const supabase = window.supabaseClient;

/* Logout — defined here early so mobile topbar button always works */
window.logout = async function() {
  try {
    if (supabase) await supabase.auth.signOut();
  } catch(e) {}
  window.location.href = "login.html";
};

async function checkAuth() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Session error:", error.message);
      window.location.href = "login.html";
      return;
    }

    /* Not logged in — enforce login first */
    if (!session) {
      window.location.href = "login.html";
      return;
    }

    /* Logged in — allow access */
    console.log("Authenticated:", session.user.email);

  } catch (err) {
    console.error("Auth error:", err);
    window.location.href = "login.html";
  }
}

/* Auto-redirect on sign out or session expiry */
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    window.location.href = "login.html";
  }
  if (event === "TOKEN_REFRESHED") {
    console.log("Session refreshed.");
  }
});

checkAuth();
