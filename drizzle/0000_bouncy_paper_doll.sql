CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'M-PESA', 'E-MOLA', 'M-KESH', 'VISA', 'MASTERCARD', 'EFT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."promotion_status" AS ENUM('active', 'expired', 'banned');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'merchant', 'admin');--> statement-breakpoint
CREATE TABLE "comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"promotion_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "like" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"promotion_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchant" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"business_name" text NOT NULL,
	"logo" text,
	"description" text,
	"address" text,
	"phone" text,
	"whatsapp" text,
	"email" text,
	"open_hours" jsonb,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "merchant_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "promotion" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_id" integer NOT NULL,
	"sponsored" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"discount_percentage" integer,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"open_hours" jsonb,
	"location" jsonb,
	"image_urls" jsonb DEFAULT '[]'::jsonb,
	"video_url" text,
	"contact" jsonb,
	"payment_methods" jsonb DEFAULT '[]'::jsonb,
	"terms" text,
	"status" "promotion_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"config" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"last_run" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_preference" (
	"user_id" text PRIMARY KEY NOT NULL,
	"language" text DEFAULT 'pt' NOT NULL,
	"favorite_categories" jsonb DEFAULT '[]'::jsonb,
	"notifications" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"phone_number" text,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_promotion_id_promotion_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "like" ADD CONSTRAINT "like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "like" ADD CONSTRAINT "like_promotion_id_promotion_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant" ADD CONSTRAINT "merchant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion" ADD CONSTRAINT "promotion_merchant_id_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "like_user_promotion_unique" ON "like" USING btree ("user_id","promotion_id");--> statement-breakpoint
CREATE INDEX "promotion_featured_idx" ON "promotion" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "promotion_end_date_idx" ON "promotion" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "promotion_created_at_idx" ON "promotion" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "promotion_cursor_idx" ON "promotion" USING btree ("featured","end_date","created_at","id");