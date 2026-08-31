CREATE TABLE `kpi_weekly_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`periodKey` varchar(10) NOT NULL,
	`valuesJson` text NOT NULL,
	`closedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kpi_weekly_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `kpi_weekly_snapshots_periodKey_unique` UNIQUE(`periodKey`)
);
