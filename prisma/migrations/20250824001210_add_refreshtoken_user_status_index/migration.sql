-- CreateIndex
CREATE INDEX `idx_refreshtoken_user_status` ON `refresh_token`(`user_id`, `status`);
