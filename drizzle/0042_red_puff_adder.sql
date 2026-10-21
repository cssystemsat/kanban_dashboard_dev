CREATE TABLE `client_assigned_subobjective_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` varchar(255) NOT NULL,
	`objectiveId` int NOT NULL,
	`subobjectiveId` int NOT NULL,
	`completed` boolean NOT NULL DEFAULT true,
	`updatedBy` varchar(320),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_assigned_subobjective_completions_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_assigned_subobjective_unique` UNIQUE(`clientId`,`objectiveId`,`subobjectiveId`)
);
--> statement-breakpoint
CREATE TABLE `client_objective_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` varchar(255) NOT NULL,
	`objectiveId` int NOT NULL,
	`assignedBy` varchar(320),
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_objective_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_objective_assignment_unique` UNIQUE(`clientId`,`objectiveId`)
);
--> statement-breakpoint
CREATE INDEX `client_assigned_subobjective_client_idx` ON `client_assigned_subobjective_completions` (`clientId`,`objectiveId`);--> statement-breakpoint
CREATE INDEX `client_objective_assignment_client_idx` ON `client_objective_assignments` (`clientId`);