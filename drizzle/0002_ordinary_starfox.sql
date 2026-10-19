CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(60) NOT NULL,
	`title` varchar(140) NOT NULL,
	`description` varchar(280) NOT NULL,
	`ctaText` varchar(50) NOT NULL DEFAULT 'استكشف الباقات',
	`tone` enum('gold','azure','emerald') NOT NULL DEFAULT 'gold',
	`isActive` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
