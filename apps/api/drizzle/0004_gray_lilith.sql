ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "display_username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "normalized_email" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_display_username_unique" UNIQUE("display_username");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_normalized_email_unique" UNIQUE("normalized_email");