CREATE TABLE "compounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"inchikey" text,
	"pubchem_cid" integer,
	"wikidata_id" text,
	"name" text NOT NULL,
	"formula" text DEFAULT '' NOT NULL,
	"molecular_weight" real,
	"iupac_name" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compounds_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"plant_id" integer NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text NOT NULL,
	"page_url" text NOT NULL,
	"license" text NOT NULL,
	"author" text NOT NULL,
	"credit" text NOT NULL,
	"position" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plant_areas" (
	"plant_id" integer NOT NULL,
	"area" text NOT NULL,
	"data" jsonb,
	"ok" boolean NOT NULL,
	"error" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plant_areas_plant_id_area_pk" PRIMARY KEY("plant_id","area")
);
--> statement-breakpoint
CREATE TABLE "plant_compounds" (
	"plant_id" integer NOT NULL,
	"compound_id" integer NOT NULL,
	"references" text[] DEFAULT '{}'::text[] NOT NULL,
	CONSTRAINT "plant_compounds_plant_id_compound_id_pk" PRIMARY KEY("plant_id","compound_id")
);
--> statement-breakpoint
CREATE TABLE "plant_publications" (
	"plant_id" integer NOT NULL,
	"publication_id" integer NOT NULL,
	"role" text NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "plant_publications_plant_id_publication_id_role_pk" PRIMARY KEY("plant_id","publication_id","role")
);
--> statement-breakpoint
CREATE TABLE "plant_trials" (
	"plant_id" integer NOT NULL,
	"nct_id" text NOT NULL,
	CONSTRAINT "plant_trials_plant_id_nct_id_pk" PRIMARY KEY("plant_id","nct_id")
);
--> statement-breakpoint
CREATE TABLE "plants" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"wp_title" text NOT NULL,
	"scientific_name" text NOT NULL,
	"accepted_name" text,
	"family" text,
	"ids" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"resolve_status" text DEFAULT 'pending' NOT NULL,
	"resolve_note" text,
	"resolved_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "publications" (
	"id" serial PRIMARY KEY NOT NULL,
	"pmid" text,
	"doi" text,
	"pmcid" text,
	"title" text NOT NULL,
	"journal" text DEFAULT '' NOT NULL,
	"year" smallint,
	"types" text[] NOT NULL,
	"open_access" boolean,
	"citations" integer,
	"url" text NOT NULL,
	"sources" text[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "publications_pmid_unique" UNIQUE("pmid")
);
--> statement-breakpoint
CREATE TABLE "raw_payloads" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"plant_slug" text NOT NULL,
	"request_key" text NOT NULL,
	"url" text NOT NULL,
	"status" smallint NOT NULL,
	"duration_ms" integer NOT NULL,
	"body" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_errors" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"plant_slug" text NOT NULL,
	"request_key" text NOT NULL,
	"url" text NOT NULL,
	"status" smallint NOT NULL,
	"message" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trials" (
	"nct_id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"status" text NOT NULL,
	"phases" text[] NOT NULL,
	"study_type" text NOT NULL,
	"conditions" text[] NOT NULL,
	"enrollment" integer,
	"start_date" text,
	"url" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_areas" ADD CONSTRAINT "plant_areas_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_compounds" ADD CONSTRAINT "plant_compounds_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_compounds" ADD CONSTRAINT "plant_compounds_compound_id_compounds_id_fk" FOREIGN KEY ("compound_id") REFERENCES "public"."compounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_publications" ADD CONSTRAINT "plant_publications_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_publications" ADD CONSTRAINT "plant_publications_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_trials" ADD CONSTRAINT "plant_trials_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_trials" ADD CONSTRAINT "plant_trials_nct_id_trials_nct_id_fk" FOREIGN KEY ("nct_id") REFERENCES "public"."trials"("nct_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "media_source_item" ON "media" USING btree ("plant_id","source","source_id");--> statement-breakpoint
CREATE INDEX "publications_doi" ON "publications" USING btree ("doi");--> statement-breakpoint
CREATE UNIQUE INDEX "raw_payloads_key" ON "raw_payloads" USING btree ("source","plant_slug","request_key");--> statement-breakpoint
CREATE INDEX "source_errors_time" ON "source_errors" USING btree ("occurred_at");