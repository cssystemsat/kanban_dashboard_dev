CREATE TABLE `client_objective_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` varchar(255) NOT NULL,
	`objectiveIndex` int NOT NULL,
	`completed` boolean NOT NULL DEFAULT true,
	`updatedBy` varchar(320),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_objective_completions_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_objective_unique` UNIQUE(`clientId`,`objectiveIndex`)
);
