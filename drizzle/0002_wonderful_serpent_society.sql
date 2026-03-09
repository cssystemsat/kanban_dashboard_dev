CREATE TABLE `page_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userEmail` varchar(320) NOT NULL,
	`page` varchar(128) NOT NULL,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	`sessionId` int,
	CONSTRAINT `page_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userEmail` varchar(320) NOT NULL,
	`actionType` varchar(64) NOT NULL,
	`description` text,
	`metadata` text,
	`performedAt` timestamp NOT NULL DEFAULT (now()),
	`sessionId` int,
	CONSTRAINT `user_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userEmail` varchar(320) NOT NULL,
	`userName` text,
	`loginAt` timestamp NOT NULL DEFAULT (now()),
	`logoutAt` timestamp,
	`durationSeconds` int,
	`ipAddress` varchar(64),
	`userAgent` text,
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`)
);
