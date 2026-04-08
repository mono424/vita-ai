-- Migration: typed_render_assigned_to
-- Created: 2026-04-08T20:20:09.255553+00:00

-- Modified
DEFINE FIELD OVERWRITE assigned_to ON jobs_render TYPE record<cv_document> PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
