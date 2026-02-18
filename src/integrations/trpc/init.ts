import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { auth } from "#/lib/auth";

export async function createContext({ req }: { req: Request }) {
	let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
	try {
		session = await auth.api.getSession({ headers: req.headers });
	} catch (error) {
		// Keep public procedures available even if auth session lookup fails.
		if (process.env.NODE_ENV === "development") {
			console.warn(
				"tRPC session lookup failed; continuing as anonymous",
				error,
			);
		}
	}
	return { session };
}

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
	transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	return next({ ctx: { ...ctx, session: ctx.session } });
});
