import { and, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { episodeListens, episodes, podcast } from "#/db/schema";
import { storage } from "#/lib/storage";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "./init";

import type { TRPCRouterRecord } from "@trpc/server";

const podcastRouter = {
	get: publicProcedure.query(async () => {
		const [row] = await db.select().from(podcast).limit(1);
		return row ?? null;
	}),

	upsert: protectedProcedure
		.input(
			z.object({
				title: z.string().min(1),
				subtitle: z.string().default(""),
				description: z.string().min(1),
				author: z.string().min(1),
				email: z.string().email(),
				imageUrl: z.string().url(),
				language: z.string().default("en"),
				category: z.string().default("Technology"),
				subcategory: z.string().default(""),
				explicit: z.boolean().default(false),
				websiteUrl: z.string().url(),
				copyright: z.string().default(""),
			}),
		)
		.mutation(async ({ input }) => {
			const [existing] = await db.select().from(podcast).limit(1);
			if (existing) {
				const [updated] = await db
					.update(podcast)
					.set({ ...input, updatedAt: new Date() })
					.where(eq(podcast.id, existing.id))
					.returning();
				return updated;
			}
			const [created] = await db.insert(podcast).values(input).returning();
			return created;
		}),
} satisfies TRPCRouterRecord;

const episodesRouter = {
	list: publicProcedure
		.input(
			z.object({
				page: z.number().int().positive().default(1),
				perPage: z.number().int().positive().default(10),
			}),
		)
		.query(async ({ input }) => {
			const offset = (input.page - 1) * input.perPage;
			const [items, [total]] = await Promise.all([
				db
					.select()
					.from(episodes)
					.where(eq(episodes.status, "published"))
					.orderBy(desc(episodes.publishedAt))
					.limit(input.perPage)
					.offset(offset),
				db
					.select({ count: count() })
					.from(episodes)
					.where(eq(episodes.status, "published")),
			]);
			return {
				items,
				total: total?.count ?? 0,
				page: input.page,
				totalPages: Math.ceil((total?.count ?? 0) / input.perPage),
			};
		}),

	getBySlug: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ input }) => {
			const [episode] = await db
				.select()
				.from(episodes)
				.where(
					and(eq(episodes.slug, input.slug), eq(episodes.status, "published")),
				)
				.limit(1);
			return episode ?? null;
		}),

	adminList: protectedProcedure.query(async () => {
		const [items, listenRows] = await Promise.all([
			db.select().from(episodes).orderBy(desc(episodes.createdAt)),
			db
				.select({
					episodeId: episodeListens.episodeId,
					listens: count(),
					uniqueListeners: sql<number>`count(distinct ${episodeListens.listenerId})`,
				})
				.from(episodeListens)
				.groupBy(episodeListens.episodeId),
		]);

		const listensByEpisode = new Map(
			listenRows.map((row) => [
				row.episodeId,
				{
					listens: Number(row.listens ?? 0),
					uniqueListeners: Number(row.uniqueListeners ?? 0),
				},
			]),
		);

		return items.map((episode) => ({
			...episode,
			listens: listensByEpisode.get(episode.id)?.listens ?? 0,
			uniqueListeners: listensByEpisode.get(episode.id)?.uniqueListeners ?? 0,
		}));
	}),

	adminGetById: protectedProcedure
		.input(z.object({ id: z.number().int() }))
		.query(async ({ input }) => {
			const [episode] = await db
				.select()
				.from(episodes)
				.where(eq(episodes.id, input.id))
				.limit(1);
			return episode ?? null;
		}),

	getUploadUrl: protectedProcedure
		.input(z.object({ key: z.string(), contentType: z.string() }))
		.mutation(async ({ input }) => {
			return storage.getUploadUrl(input.key, input.contentType);
		}),

	create: protectedProcedure
		.input(
			z.object({
				slug: z.string().min(1),
				title: z.string().min(1),
				description: z.string().min(1),
				content: z.string().default(""),
				audioKey: z.string().min(1),
				audioDuration: z.number().int().default(0),
				audioSize: z.number().int().default(0),
				audioMimeType: z.string().default("audio/mpeg"),
				episodeNumber: z.number().int().nullable().optional(),
				seasonNumber: z.number().int().nullable().optional(),
				episodeType: z.enum(["full", "trailer", "bonus"]).default("full"),
				explicit: z.boolean().default(false),
				status: z.enum(["draft", "published"]).default("draft"),
				publishedAt: z.coerce.date().nullable().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const [episode] = await db.insert(episodes).values(input).returning();
			return episode;
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.number().int(),
				slug: z.string().min(1).optional(),
				title: z.string().min(1).optional(),
				description: z.string().optional(),
				content: z.string().optional(),
				audioKey: z.string().optional(),
				audioDuration: z.number().int().optional(),
				audioSize: z.number().int().optional(),
				audioMimeType: z.string().optional(),
				episodeNumber: z.number().int().nullable().optional(),
				seasonNumber: z.number().int().nullable().optional(),
				episodeType: z.enum(["full", "trailer", "bonus"]).optional(),
				explicit: z.boolean().optional(),
				status: z.enum(["draft", "published"]).optional(),
				publishedAt: z.coerce.date().nullable().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input;
			const [episode] = await db
				.update(episodes)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(episodes.id, id))
				.returning();
			return episode;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.number().int() }))
		.mutation(async ({ input }) => {
			await db.delete(episodes).where(eq(episodes.id, input.id));
			return { success: true };
		}),
} satisfies TRPCRouterRecord;

export const trpcRouter = createTRPCRouter({
	podcast: podcastRouter,
	episodes: episodesRouter,
});

export type TRPCRouter = typeof trpcRouter;
