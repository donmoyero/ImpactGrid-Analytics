/* ================= SUPABASE CLIENT ================= */

const supabase = window.supabase.createClient(
"YOUR_SUPABASE_URL",
"YOUR_PUBLIC_ANON_KEY"
);

/* ================= AUTH GUARD ================= */

async function checkAuth() {

    try {

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error("Auth error:", error);
            window.location.href = "login.html";
            return;
        }

        if (!session) {
            window.location.href = "login.html";
            return;
        }

        console.log("User authenticated:", session.user.email);

    } catch (err) {

        console.error("Auth guard failure:", err);
        window.location.href = "login.html";

    }

}

checkAuth();
