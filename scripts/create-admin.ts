/**
 * Run this once to create your admin account:
 *   bunx tsx scripts/create-admin.ts
 *
 * Make sure DATABASE_URL is set in .env.local first.
 */
import { config } from "dotenv"

config({ path: ".env.local" })

// Dynamically import auth after env is loaded
const { auth } = await import("../src/lib/auth.ts")

const email = process.env.ADMIN_EMAIL ?? "admin@imposter.fm"
const password = process.env.ADMIN_PASSWORD ?? "changeme123"
const name = process.env.ADMIN_NAME ?? "Admin"

try {
	const result = await auth.api.signUpEmail({
		body: { email, password, name },
	})
	console.log("✓ Admin user created:", result.user?.email)
	console.log("  Email:", email)
	console.log("  Password:", password)
	console.log("\nChange your password after first login!")
} catch (err) {
	console.error("Failed to create admin:", err)
	process.exit(1)
}
