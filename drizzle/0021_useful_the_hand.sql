CREATE TABLE `analyst_score_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobType` varchar(32) NOT NULL,
	`taskUid` varchar(65) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analyst_score_schedules_id` PRIMARY KEY(`id`)
);
