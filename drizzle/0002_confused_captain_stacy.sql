DROP INDEX "like_user_promotion_unique";--> statement-breakpoint
CREATE INDEX "like_user_idx" ON "like" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "like_promotion_idx" ON "like" USING btree ("promotion_id");--> statement-breakpoint
ALTER TABLE "like" ADD CONSTRAINT "unique_user_promo_like" UNIQUE("user_id","promotion_id");