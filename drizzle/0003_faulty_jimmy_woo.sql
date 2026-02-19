CREATE TABLE "seen_github_usernames" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_mapping_id" uuid NOT NULL,
	"github_username" varchar(255) NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seen_github_usernames_webhook_mapping_id_github_username_unique" UNIQUE("webhook_mapping_id","github_username")
);
--> statement-breakpoint
ALTER TABLE "seen_github_usernames" ADD CONSTRAINT "seen_github_usernames_webhook_mapping_id_webhook_mappings_id_fk" FOREIGN KEY ("webhook_mapping_id") REFERENCES "public"."webhook_mappings"("id") ON DELETE cascade ON UPDATE no action;