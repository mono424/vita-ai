-- Migration: add_jobs_table
-- Created: 2026-03-15T15:28:55.997875+00:00

-- Added
DEFINE TABLE jobs_render TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE true;
DEFINE FIELD assigned_to ON jobs_render TYPE record PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD created_at ON jobs_render TYPE datetime VALUE time::now() PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD errors ON jobs_render TYPE array<object> DEFAULT ALWAYS [] PERMISSIONS FOR select, update WHERE false, FOR create WHERE true;
DEFINE FIELD max_retries ON jobs_render TYPE int DEFAULT ALWAYS 3 PERMISSIONS FULL;
DEFINE FIELD path ON jobs_render TYPE string PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD payload ON jobs_render TYPE any PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD retries ON jobs_render TYPE int DEFAULT ALWAYS 0 PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD retry_strategy ON jobs_render TYPE string DEFAULT ALWAYS 'linear' ASSERT $value INSIDE ['linear', 'exponential'] PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD status ON jobs_render TYPE string DEFAULT ALWAYS 'pending' ASSERT $value INSIDE ['pending', 'processing', 'success', 'failed'] PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD updated_at ON jobs_render TYPE datetime DEFAULT ALWAYS time::now() PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
