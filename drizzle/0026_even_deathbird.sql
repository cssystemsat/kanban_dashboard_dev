CREATE TABLE `app_kanban_new_client_ack` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cardId` int NOT NULL,
	`acknowledgedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_kanban_new_client_ack_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_kanban_new_client_ack_unique` UNIQUE(`userId`,`cardId`)
);
