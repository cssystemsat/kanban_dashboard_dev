ALTER TABLE `app_kanban_cards` ADD `iosRejected` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `app_kanban_cards` ADD `androidRejected` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `app_kanban_cards` ADD `iosStoreUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `app_kanban_cards` ADD `androidStoreUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `app_kanban_checklist` ADD `nomeApp` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `app_kanban_checklist` ADD `lojaPropria` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `app_kanban_checklist` ADD `siteEmpresa` boolean DEFAULT false NOT NULL;