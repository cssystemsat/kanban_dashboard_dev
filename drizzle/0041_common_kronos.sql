CREATE TABLE `objective_template_subobjectives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`objectiveId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`deadlineDays` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `objective_template_subobjectives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `objective_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`createdBy` varchar(320) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `objective_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `objective_templates_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE INDEX `objective_template_subobjectives_objective_idx` ON `objective_template_subobjectives` (`objectiveId`);