ALTER TABLE "trials" ADD COLUMN "completion_date" text;--> statement-breakpoint
ALTER TABLE "trials" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "trials" ADD COLUMN "interventions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "trials" ADD COLUMN "sponsor" text;--> statement-breakpoint
ALTER TABLE "trials" ADD COLUMN "countries" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "trials" ADD COLUMN "has_results" boolean DEFAULT false NOT NULL;