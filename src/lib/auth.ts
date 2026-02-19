import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { db } from "#/db"
import * as authSchema from "../../auth-schema"

const secret = process.env.BETTER_AUTH_SECRET?.trim()
if (!secret) {
	throw new Error("BETTER_AUTH_SECRET is required")
}

const baseURL = process.env.BETTER_AUTH_BASE_URL?.trim()
const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean)

export const auth = betterAuth({
	secret,
	...(baseURL ? { baseURL } : {}),
	...(trustedOrigins.length > 0 ? { trustedOrigins } : {}),
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: authSchema,
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [tanstackStartCookies()],
})
