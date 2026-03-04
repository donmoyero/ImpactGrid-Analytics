/* ================= SUPABASE CONFIG ================= */

const SUPABASE_URL = "https://vopehiqnduxobtaamrnh.supabase.co";
const SUPABASE_KEY = "sb_publishable_oPR-GdRq7Rz3RvBepMkVQw_b7R6ocA3";

/* ================= CREATE CLIENT ================= */

if (!window.supabaseClient) {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}
