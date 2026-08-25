CREATE TABLE `app_kanban_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`csm` varchar(255) NOT NULL,
	`startDate` date NOT NULL,
	`stage` enum('venda_feita','formulario','revisao_dados','desenvolvimento','envio_lojas','teste_liberacao','app_entregue') NOT NULL DEFAULT 'venda_feita',
	`order` int NOT NULL DEFAULT 0,
	`createdBy` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_kanban_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `app_kanban_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cardId` int NOT NULL,
	`fromStage` varchar(64) NOT NULL,
	`toStage` varchar(64) NOT NULL,
	`movedBy` varchar(320) NOT NULL,
	`movedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_kanban_history_id` PRIMARY KEY(`id`)
);
