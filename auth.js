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

    /* If user is NOT logged in → go to login page */
    if (!session) {
      window.location.href = "login.html";
      return;
    }

    /* If logged in → allow dashboard */
    console.log("User authenticated:", session.user.email);

    /* Show the app now that auth is confirmed */
    const app = document.getElementById("app");
    if (app) app.style.opacity = "1";

  } catch (err) {
    console.error("Auth error:", err);
    window.location.href = "login.html";
  }
}

/* ================= LISTEN FOR AUTH CHANGES ================= */
/* Handles token refresh and session expiry automatically */
supabase.auth.onAuthStateChange((event, session) => {

  if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
    window.location.href = "login.html";
  }

  if (event === "TOKEN_REFRESHED") {
    console.log("Session token refreshed.");
  }

});

checkAuth();
