CREATE TABLE "episodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"audio_key" text NOT NULL,
	"audio_duration" integer DEFAULT 0 NOT NULL,
	"audio_size" integer DEFAULT 0 NOT NULL,
	"audio_mime_type" text DEFAULT 'audio/mpeg' NOT NULL,
	"episode_number" integer,
	"season_number" integer,
	"episode_type" text DEFAULT 'full' NOT NULL,
	"explicit" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "episodes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "podcast" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"description" text NOT NULL,
	"author" text NOT NULL,
	"email" text NOT NULL,
	"image_url" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"category" text DEFAULT 'Technology' NOT NULL,
	"subcategory" text DEFAULT '' NOT NULL,
	"explicit" boolean DEFAULT false NOT NULL,
	"website_url" text NOT NULL,
	"copyright" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
