ALTER TABLE `allowed_emails` ADD `canMoveAppKanban` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `allowed_emails` ADD `onlyAppKanban` int DEFAULT 0 NOT NULL;