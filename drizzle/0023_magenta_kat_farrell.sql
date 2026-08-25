CREATE TABLE `client_comment_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`comment` text NOT NULL,
	`monthYear` varchar(7) NOT NULL,
	`authorEmail` varchar(320),
	`authorName` text,
	`action` varchar(16) NOT NULL DEFAULT 'saved',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_comment_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `client_comment_history_client_month_idx` ON `client_comment_history` (`clientName`,`monthYear`);--> statement-breakpoint
CREATE INDEX `client_comment_history_created_at_idx` ON `client_comment_history` (`createdAt`);