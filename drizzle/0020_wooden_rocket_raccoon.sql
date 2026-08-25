CREATE TABLE `analyst_score_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analystName` varchar(128) NOT NULL,
	`category` varchar(32) NOT NULL,
	`yearMonth` varchar(7) NOT NULL,
	`finalScore` int NOT NULL,
	`penaltiesJson` text NOT NULL,
	`savedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyst_score_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analyst_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analystName` varchar(128) NOT NULL,
	`category` varchar(32) NOT NULL,
	`yearMonth` varchar(7) NOT NULL,
	`score` int NOT NULL DEFAULT 100,
	`penaltiesJson` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analyst_scores_id` PRIMARY KEY(`id`)
);
