-- Migration: fix_cv_document_defaults
-- Created: 2026-03-18T00:03:18.866653+00:00
-- Note: backfill was applied manually; only field definitions here

DEFINE FIELD OVERWRITE selected_bullets ON cv_document TYPE array<record<bullet_entry>> DEFAULT [] PERMISSIONS FULL;
DEFINE FIELD OVERWRITE selected_education ON cv_document TYPE array<record<education_entry>> DEFAULT [] PERMISSIONS FULL;
DEFINE FIELD OVERWRITE selected_experience ON cv_document TYPE array<record<experience_entry>> DEFAULT [] PERMISSIONS FULL;
DEFINE FIELD OVERWRITE selected_projects ON cv_document TYPE array<record<project_entry>> DEFAULT [] PERMISSIONS FULL;
DEFINE FIELD OVERWRITE selected_skills ON cv_document TYPE array<record<skill_entry>> DEFAULT [] PERMISSIONS FULL;
