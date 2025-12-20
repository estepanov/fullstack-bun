CREATE TABLE "ban" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"banned_by" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"unbanned_at" timestamp,
	"unbanned_by" text
);
--> statement-breakpoint
ALTER TABLE "ban" ADD CONSTRAINT "ban_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ban" ADD CONSTRAINT "ban_banned_by_user_id_fk" FOREIGN KEY ("banned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ban" ADD CONSTRAINT "ban_unbanned_by_user_id_fk" FOREIGN KEY ("unbanned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ban_userId_idx" ON "ban" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ban_bannedBy_idx" ON "ban" USING btree ("banned_by");