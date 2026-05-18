CREATE TABLE `checklist_item_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`previousText` varchar(500) NOT NULL,
	`previousDueDate` varchar(10),
	`changedBy` varchar(320) NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `checklist_item_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `checklist_items` ADD `dueDate` varchar(10);