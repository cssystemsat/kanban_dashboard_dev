ALTER TABLE `admin_notice_acknowledgments` DROP INDEX `admin_notice_user_unique`;--> statement-breakpoint
ALTER TABLE `admin_notice_acknowledgments` ADD `occurrenceKey` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `admin_notice_acknowledgments` ADD CONSTRAINT `admin_notice_user_occurrence_unique` UNIQUE(`noticeId`,`userEmail`,`occurrenceKey`);