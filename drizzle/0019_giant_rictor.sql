CREATE TABLE `daily_losses_acknowledgments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`acknowledgedDate` date NOT NULL,
	`acknowledgedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_losses_acknowledgments_id` PRIMARY KEY(`id`)
);
