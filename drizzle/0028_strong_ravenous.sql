CREATE TABLE `wootric_response_ack` (
	`id` int AUTO_INCREMENT NOT NULL,
	`responseId` int NOT NULL,
	`userId` int NOT NULL,
	`acknowledgedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wootric_response_ack_id` PRIMARY KEY(`id`),
	CONSTRAINT `wootric_response_ack_unique` UNIQUE(`responseId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `wootric_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wootricId` varchar(64) NOT NULL,
	`externalId` varchar(255),
	`email` varchar(320),
	`endUserId` varchar(64),
	`surveyId` varchar(64),
	`score` int NOT NULL,
	`text` text,
	`tags` text,
	`properties` text,
	`createdAtWootric` timestamp,
	`updatedAtWootric` timestamp,
	`rawPayload` text,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wootric_responses_id` PRIMARY KEY(`id`),
	CONSTRAINT `wootric_responses_wootric_id_unique` UNIQUE(`wootricId`)
);
--> statement-breakpoint
CREATE INDEX `wootric_responses_created_at_idx` ON `wootric_responses` (`createdAtWootric`);