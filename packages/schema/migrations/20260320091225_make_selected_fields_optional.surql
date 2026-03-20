-- Migration: make_selected_fields_optional
-- Created: 2026-03-20T09:12:26.704692+00:00

-- Modified
DEFINE FIELD OVERWRITE selected_bullets ON cv_document TYPE none | array<record<bullet_entry>> DEFAULT [] PERMISSIONS FULL;
DEFINE FIELD OVERWRITE selected_education ON cv_document TYPE none | array<record<education_entry>> DEFAULT [] PERMISSIONS FULL;
DEFINE FIELD OVERWRITE selected_experience ON cv_document TYPE none | array<record<experience_entry>> DEFAULT [] PERMISSIONS FULL;
DEFINE FIELD OVERWRITE selected_projects ON cv_document TYPE none | array<record<project_entry>> DEFAULT [] PERMISSIONS FULL;
DEFINE FIELD OVERWRITE selected_skills ON cv_document TYPE none | array<record<skill_entry>> DEFAULT [] PERMISSIONS FULL;
