CREATE TABLE `migrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('planejamento','em_progresso','concluido','cancelado') NOT NULL DEFAULT 'planejamento',
	`sourceSystem` varchar(128),
	`targetSystem` varchar(128),
	`estimatedRecords` int,
	`processedRecords` int DEFAULT 0,
	`owner` varchar(320),
	`startDate` timestamp,
	`endDate` timestamp,
	`priority` enum('baixa','media','alta') NOT NULL DEFAULT 'media',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `migrations_id` PRIMARY KEY(`id`)
);
