-- Migration: Add avatar column to leads (avatar tagging in Lead Capture flow)
ALTER TABLE leads ADD COLUMN avatar TEXT;
