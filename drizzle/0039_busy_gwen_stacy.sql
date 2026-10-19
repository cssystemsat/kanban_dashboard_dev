CREATE TABLE `api_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userEmail` varchar(320) NOT NULL,
	`label` varchar(120) NOT NULL,
	`tokenPrefix` varchar(20) NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`lastUsedAt` timestamp,
	`revokedAt` timestamp,
	`createdBy` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_tokens_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE INDEX `api_tokens_user_email_idx` ON `api_tokens` (`userEmail`);