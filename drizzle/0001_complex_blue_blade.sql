CREATE TABLE "episode_listens" (
	"id" serial PRIMARY KEY NOT NULL,
	"episode_id" integer NOT NULL,
	"listener_id" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "episode_listens" ADD CONSTRAINT "episode_listens_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "episode_listens_episode_id_idx" ON "episode_listens" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "episode_listens_created_at_idx" ON "episode_listens" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "episode_listens_listener_id_idx" ON "episode_listens" USING btree ("listener_id");