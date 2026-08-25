CREATE TABLE `allowed_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`label` text,
	`isAdmin` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `allowed_emails_id` PRIMARY KEY(`id`),
	CONSTRAINT `allowed_emails_email_unique` UNIQUE(`email`)
);
