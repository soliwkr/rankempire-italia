-- Migration: Add tracking columns to projects
ALTER TABLE projects ADD COLUMN ga4_measurement_id TEXT;
ALTER TABLE projects ADD COLUMN gsc_site_url TEXT;
