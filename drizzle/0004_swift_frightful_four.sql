CREATE TABLE "reviewer_pings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_mapping_id" uuid NOT NULL,
	"discord_user_id" varchar(255) NOT NULL,
	"watched_github_usernames" varchar(255)[] NOT NULL,
	"watched_event_keys" varchar(100)[] NOT NULL,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviewer_pings_webhook_mapping_id_discord_user_id_unique" UNIQUE("webhook_mapping_id","discord_user_id")
);
--> statement-breakpoint
ALTER TABLE "reviewer_pings" ADD CONSTRAINT "reviewer_pings_webhook_mapping_id_webhook_mappings_id_fk" FOREIGN KEY ("webhook_mapping_id") REFERENCES "public"."webhook_mappings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviewer_pings" ADD CONSTRAINT "reviewer_pings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;