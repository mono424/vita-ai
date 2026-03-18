-- Migration: rename_session_to_chat_session
-- Created: 2026-03-18T00:11:22.464434+00:00

-- Added (replaces old 'session' field which is a protected variable name in SurrealDB)
DEFINE FIELD OVERWRITE chat_session ON chat_message TYPE record<chat_session> PERMISSIONS FULL;

-- Modified
DEFINE FIELD OVERWRITE errors ON jobs_agent TYPE array<object> DEFAULT ALWAYS [] PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
