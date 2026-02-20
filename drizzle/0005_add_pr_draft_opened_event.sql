-- Backfill pr_draft_opened into existing configurations so users
-- who previously watched pr_opened don't silently lose draft PR coverage.

-- 1) reviewer_pings: append 'pr_draft_opened' to watched_event_keys
--    for any row that already watches 'pr_opened'
UPDATE "reviewer_pings"
SET "watched_event_keys" = array_append("watched_event_keys", 'pr_draft_opened')
WHERE 'pr_opened' = ANY("watched_event_keys")
  AND NOT ('pr_draft_opened' = ANY("watched_event_keys"));

-- 2) ping_settings: copy pr_opened rows as pr_draft_opened
--    so author-ping toggles carry over
INSERT INTO "ping_settings" ("webhook_mapping_id", "event_key", "enabled", "user_id")
SELECT "webhook_mapping_id", 'pr_draft_opened', "enabled", "user_id"
FROM "ping_settings"
WHERE "event_key" = 'pr_opened'
ON CONFLICT ("webhook_mapping_id", "event_key") DO NOTHING;
