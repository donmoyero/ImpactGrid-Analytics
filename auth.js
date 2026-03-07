/* ================= USE GLOBAL SUPABASE CLIENT ================= */
const supabase = window.supabaseClient;

/* ================= AUTH GUARD ================= */
async function checkAuth() {
  try {

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Session error:", error.message);
      window.location.href = "login.html";
      return;
    }

    /* Not logged in — send to login */
    if (!session) {
      window.location.href = "login.html";
      return;
    }

    /* Logged in — all good */
    console.log("Authenticated:", session.user.email);

  } catch (err) {
    console.error("Auth error:", err);
    window.location.href = "login.html";
  }
}

/* ================= AUTO REDIRECT ON SIGN OUT ================= */
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    window.location.href = "login.html";
  }
  if (event === "TOKEN_REFRESHED") {
    console.log("Token refreshed.");
  }
});

checkAuth();
