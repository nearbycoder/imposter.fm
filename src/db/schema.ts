import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const podcast = pgTable("podcast", {
	id: serial().primaryKey(),
	title: text().notNull(),
	subtitle: text().notNull().default(""),
	description: text().notNull(),
	author: text().notNull(),
	email: text().notNull(),
	imageUrl: text("image_url").notNull(),
	language: text().notNull().default("en"),
	category: text().notNull().default("Technology"),
	subcategory: text().notNull().default(""),
	explicit: boolean().notNull().default(false),
	websiteUrl: text("website_url").notNull(),
	copyright: text().notNull().default(""),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const episodes = pgTable("episodes", {
	id: serial().primaryKey(),
	slug: text().notNull().unique(),
	title: text().notNull(),
	description: text().notNull(),
	content: text().notNull().default(""),
	audioKey: text("audio_key").notNull(),
	audioDuration: integer("audio_duration").notNull().default(0),
	audioSize: integer("audio_size").notNull().default(0),
	audioMimeType: text("audio_mime_type").notNull().default("audio/mpeg"),
	episodeNumber: integer("episode_number"),
	seasonNumber: integer("season_number"),
	episodeType: text("episode_type").notNull().default("full"),
	explicit: boolean().notNull().default(false),
	status: text().notNull().default("draft"),
	publishedAt: timestamp("published_at"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export const episodeListens = pgTable(
	"episode_listens",
	{
		id: serial().primaryKey(),
		episodeId: integer("episode_id")
			.notNull()
			.references(() => episodes.id, { onDelete: "cascade" }),
		listenerId: text("listener_id"),
		userAgent: text("user_agent"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		episodeIdIdx: index("episode_listens_episode_id_idx").on(table.episodeId),
		createdAtIdx: index("episode_listens_created_at_idx").on(table.createdAt),
		listenerIdIdx: index("episode_listens_listener_id_idx").on(
			table.listenerId,
		),
	}),
);
