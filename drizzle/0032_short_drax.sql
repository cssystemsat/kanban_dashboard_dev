CREATE TABLE `problemas_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientKey` varchar(255) NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`boleto` varchar(255) NOT NULL DEFAULT '',
	`comercial` varchar(255) NOT NULL DEFAULT '',
	`csm` varchar(255) NOT NULL DEFAULT '',
	`flag` varchar(64) NOT NULL,
	`stage` varchar(64) NOT NULL DEFAULT 'nova_flag',
	`problem` text,
	`actionPlan` text,
	`dueDate` varchar(10),
	`responsible` varchar(255),
	`isActive` int NOT NULL DEFAULT 1,
	`updatedBy` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `problemas_cards_id` PRIMARY KEY(`id`),
	CONSTRAINT `problemas_cards_client_key_unique` UNIQUE(`clientKey`)
);
--> statement-breakpoint
CREATE INDEX `problemas_cards_stage_idx` ON `problemas_cards` (`stage`);--> statement-breakpoint
CREATE INDEX `problemas_cards_active_idx` ON `problemas_cards` (`isActive`);