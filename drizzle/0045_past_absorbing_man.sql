CREATE TABLE `timeline_client_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`objective` text NOT NULL,
	`updatedBy` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeline_client_details_id` PRIMARY KEY(`id`),
	CONSTRAINT `timeline_client_details_clientName_unique` UNIQUE(`clientName`)
);
