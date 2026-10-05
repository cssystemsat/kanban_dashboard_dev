CREATE TABLE `client_subobjective_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` varchar(255) NOT NULL,
	`objectiveName` varchar(255) NOT NULL,
	`subobjectiveIndex` int NOT NULL,
	`completed` boolean NOT NULL DEFAULT true,
	`updatedBy` varchar(320),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_subobjective_completions_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_subobjective_unique` UNIQUE(`clientId`,`objectiveName`,`subobjectiveIndex`)
);
--> statement-breakpoint
CREATE INDEX `client_subobjective_client_objective_idx` ON `client_subobjective_completions` (`clientId`,`objectiveName`);