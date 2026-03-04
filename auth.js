/* ================= USE GLOBAL SUPABASE CLIENT ================= */

const supabase = window.supabaseClient;

/* ================= AUTH GUARD ================= */

async function checkAuth() {

try {

const { data: { session } } = await supabase.auth.getSession();

/* If user is NOT logged in → go to login page */

if (!session) {
window.location.href = "login.html";
return;
}

/* If logged in → allow dashboard */

console.log("User authenticated:", session.user.email);

} catch (err) {

console.error("Auth error:", err);
window.location.href = "login.html";

}

}

checkAuth();
