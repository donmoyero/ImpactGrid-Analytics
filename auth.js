/* ================= SUPABASE CLIENT ================= */

const supabase = window.supabase.createClient(
    "https://vopehiqnduxobtaamrnh.supabase.co",
    "sb_publishable_oPR-GdRq7Rz3RvBepMkVQw_b7R6ocA3"
);

/* ================= AUTH GUARD ================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error("Session error:", error);
            window.location.href = "login.html";
            return;
        }

        if (!data.session) {
            window.location.href = "login.html";
            return;
        }

        console.log("User authenticated");

    } catch (err) {

        console.error("Auth guard failure:", err);
        window.location.href = "login.html";

    }

});
