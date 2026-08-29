const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(`Missing required GitHub repository variable(s): ${missing.join(", ")}`);
  process.exit(1);
}
console.log("Production Supabase configuration is present");
