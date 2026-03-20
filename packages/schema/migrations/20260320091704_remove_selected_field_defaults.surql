-- Migration: remove_selected_field_defaults
-- Created: 2026-03-20T09:17:06.333953+00:00

-- Modified
DEFINE FIELD OVERWRITE selected_bullets ON cv_document TYPE none | array<record<bullet_entry>> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE selected_education ON cv_document TYPE none | array<record<education_entry>> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE selected_experience ON cv_document TYPE none | array<record<experience_entry>> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE selected_projects ON cv_document TYPE none | array<record<project_entry>> PERMISSIONS FULL;
DEFINE FIELD OVERWRITE selected_skills ON cv_document TYPE none | array<record<skill_entry>> PERMISSIONS FULL;
