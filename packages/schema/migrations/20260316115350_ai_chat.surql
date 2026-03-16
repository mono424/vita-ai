-- Migration: ai_chat
-- Created: 2026-03-16T11:53:51.698072+00:00

-- Added
DEFINE TABLE chat_message TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE owner = $auth.id;
DEFINE TABLE jobs_agent TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE true;
DEFINE FIELD content ON chat_message TYPE none | string PERMISSIONS FULL;
DEFINE FIELD created_at ON chat_message TYPE none | datetime VALUE time::now() PERMISSIONS FULL;
DEFINE FIELD import_summary ON chat_message TYPE none | object FLEXIBLE PERMISSIONS FULL;
DEFINE FIELD job_id ON chat_message TYPE none | string PERMISSIONS FULL;
DEFINE FIELD owner ON chat_message TYPE none | record<user> PERMISSIONS FOR select WHERE true, FOR create WHERE $access = 'account', FOR update WHERE false;
DEFINE FIELD role ON chat_message TYPE none | string ASSERT $value INSIDE ['user', 'assistant'] PERMISSIONS FULL;
DEFINE FIELD writing ON chat_message TYPE none | bool PERMISSIONS FULL;
DEFINE FIELD assigned_to ON jobs_agent TYPE record PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD created_at ON jobs_agent TYPE datetime VALUE time::now() PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD errors ON jobs_agent TYPE array<object> DEFAULT ALWAYS [] PERMISSIONS FOR select, update WHERE false, FOR create WHERE true;
DEFINE FIELD max_retries ON jobs_agent TYPE int DEFAULT ALWAYS 3 PERMISSIONS FULL;
DEFINE FIELD path ON jobs_agent TYPE string PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD payload ON jobs_agent TYPE any PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD retries ON jobs_agent TYPE int DEFAULT ALWAYS 0 PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD retry_strategy ON jobs_agent TYPE string DEFAULT ALWAYS 'linear' ASSERT $value INSIDE ['linear', 'exponential'] PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD status ON jobs_agent TYPE string DEFAULT ALWAYS 'pending' ASSERT $value INSIDE ['pending', 'processing', 'success', 'failed'] PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD updated_at ON jobs_agent TYPE datetime DEFAULT ALWAYS time::now() PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
