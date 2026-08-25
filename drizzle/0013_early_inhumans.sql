CREATE TABLE `app_kanban_checklist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cardId` int NOT NULL,
	`logomarca` boolean NOT NULL DEFAULT false,
	`descricaoCurta` boolean NOT NULL DEFAULT false,
	`descricaoLonga` boolean NOT NULL DEFAULT false,
	`politicaPrivacidade` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_kanban_checklist_id` PRIMARY KEY(`id`)
);
