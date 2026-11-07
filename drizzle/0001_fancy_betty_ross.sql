CREATE TABLE `ai_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workoutLogId` int NOT NULL,
	`userId` int NOT NULL,
	`summary` text NOT NULL,
	`strengthProgressAnalysis` text NOT NULL,
	`sleepWellnessCorrelation` text NOT NULL,
	`anomaliesAndRisks` text NOT NULL,
	`conclusions` text NOT NULL,
	`recommendations` text NOT NULL,
	`riskLevel` enum('low','medium','high') NOT NULL DEFAULT 'low',
	`riskFlags` text NOT NULL,
	`progressPerExercise` text NOT NULL,
	`modelUsed` varchar(64) NOT NULL,
	`generationMs` int NOT NULL DEFAULT 0,
	`rawResponse` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_reports_workoutLogId_unique` UNIQUE(`workoutLogId`)
);
--> statement-breakpoint
CREATE TABLE `body_measurements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`measuredAt` timestamp NOT NULL DEFAULT (now()),
	`weight` decimal(5,2) NOT NULL,
	`heightCm` int,
	`chest` decimal(5,2),
	`waist` decimal(5,2),
	`hips` decimal(5,2),
	`biceps` decimal(5,2),
	`thigh` decimal(5,2),
	`bodyFat` decimal(4,1),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `body_measurements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_invite_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`maxUses` int,
	`usesCount` int NOT NULL DEFAULT 0,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_invite_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `coach_invite_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `coach_trainees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coachId` int NOT NULL,
	`traineeId` int NOT NULL,
	`status` enum('active','paused','archived') NOT NULL DEFAULT 'active',
	`linkedAt` timestamp NOT NULL DEFAULT (now()),
	`inviteCodeUsed` varchar(32),
	`coachNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_trainees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `session_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `workout_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workoutDate` timestamp NOT NULL DEFAULT (now()),
	`title` varchar(255) NOT NULL,
	`wellness` int NOT NULL,
	`sleepHours` decimal(3,1) NOT NULL,
	`heartRate` int,
	`bodyWeight` decimal(5,2),
	`notes` text,
	`energyLevel` int,
	`stressLevel` int,
	`durationMinutes` int,
	`exercises` text NOT NULL,
	`totalVolume` decimal(9,2) NOT NULL DEFAULT '0',
	`totalSets` int NOT NULL DEFAULT 0,
	`totalReps` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workout_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('coach','trainee','admin') NOT NULL DEFAULT 'trainee';--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `heightCm` int;--> statement-breakpoint
ALTER TABLE `users` ADD `initialWeight` decimal(5,2);--> statement-breakpoint
ALTER TABLE `users` ADD `currentWeight` decimal(5,2);--> statement-breakpoint
ALTER TABLE `users` ADD `targetWeight` decimal(5,2);--> statement-breakpoint
ALTER TABLE `users` ADD `notes` text;