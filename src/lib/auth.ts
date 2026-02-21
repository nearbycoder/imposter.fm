import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { db } from "#/db"
import * as authSchema from "../../auth-schema"

const isProduction = process.env.NODE_ENV === "production"
const configuredSecret = process.env.BETTER_AUTH_SECRET?.trim()
const secret =
	configuredSecret ||
	(!isProduction ? "dev-only-insecure-secret-change-me" : "")

if (!secret) {
	throw new Error("BETTER_AUTH_SECRET is required in production")
}

if (!configuredSecret && !isProduction) {
	console.warn(
		"BETTER_AUTH_SECRET is not set. Using development fallback secret.",
	)
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
