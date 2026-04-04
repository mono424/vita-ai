-- Migration: initial
-- Created: 2026-03-15T09:12:36.902915+00:00
-- Consolidated from 17 migrations into a single initial schema.

-- ##################################################################
-- SCOPES & AUTHENTICATION
-- ##################################################################

DEFINE ACCESS account ON DATABASE TYPE RECORD
  SIGNUP ( CREATE user SET username = $username, password = crypto::argon2::generate($password) )
  SIGNIN ( SELECT * FROM user WHERE username = $username AND crypto::argon2::compare(password, $password) )
  DURATION FOR TOKEN 15m, FOR SESSION 30d
;

-- ##################################################################
-- SPOOKY SYSTEM TABLES (_00_ prefix)
-- ##################################################################

DEFINE TABLE _00_list_ref SCHEMALESS
    PERMISSIONS FOR select, create, update WHERE true;

DEFINE FIELD clientId ON TABLE _00_list_ref TYPE string
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD in ON TABLE _00_list_ref TYPE record
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD out ON TABLE _00_list_ref TYPE record
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD parent ON TABLE _00_list_ref TYPE option<record<_00_list_ref>>
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD parent_rel ON TABLE _00_list_ref TYPE option<string>
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD updatedAt ON TABLE _00_list_ref TYPE datetime VALUE time::now() READONLY
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD version ON TABLE _00_list_ref TYPE int
    PERMISSIONS FOR select, create, update WHERE true;

DEFINE TABLE _00_query SCHEMALESS
    PERMISSIONS FOR select, create, update WHERE true;

DEFINE FIELD clientId ON TABLE _00_query TYPE option<string>
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD lastActiveAt ON TABLE _00_query TYPE datetime DEFAULT time::now()
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD surql ON TABLE _00_query TYPE option<string>
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD ttl ON TABLE _00_query TYPE duration
    PERMISSIONS FOR select, create, update WHERE true;

DEFINE EVENT _00_dbsp_cleanup ON TABLE _00_query WHEN $event = "DELETE" THEN {
    let $payload = { id: <string>$before.id };
    let $result = http::post('http://localhost:8667/view/unregister', $payload, { "Authorization": "Bearer " });
};

DEFINE TABLE _00_version SCHEMALESS
    PERMISSIONS FOR select WHERE true;

DEFINE FIELD record_id ON TABLE _00_version TYPE record;
DEFINE FIELD version ON TABLE _00_version TYPE int;
DEFINE INDEX idx_record_id ON TABLE _00_version COLUMNS record_id UNIQUE;

DEFINE TABLE _00_module_state SCHEMALESS PERMISSIONS FULL;

DEFINE TABLE IF NOT EXISTS _00_migrations SCHEMAFULL PERMISSIONS NONE;
DEFINE FIELD IF NOT EXISTS applied_at ON _00_migrations TYPE datetime VALUE time::now();
DEFINE FIELD IF NOT EXISTS checksum ON _00_migrations TYPE string;
DEFINE FIELD IF NOT EXISTS name ON _00_migrations TYPE string;
DEFINE FIELD IF NOT EXISTS version ON _00_migrations TYPE string;
DEFINE INDEX IF NOT EXISTS idx_version ON _00_migrations FIELDS version UNIQUE;

-- ##################################################################
-- USER TABLE
-- ##################################################################

DEFINE TABLE user SCHEMAFULL
PERMISSIONS
  FOR update, delete WHERE $access = "account" AND id = $auth.id
  FOR create, select WHERE true;

DEFINE FIELD username ON TABLE user TYPE string
ASSERT $value != NONE AND string::len($value) > 3
PERMISSIONS
    FOR select WHERE true
    FOR create WHERE true
    FOR update WHERE $access = "account" AND id = $auth.id;

DEFINE FIELD password ON TABLE user TYPE string
ASSERT $value != NONE AND string::len($value) > 0
PERMISSIONS
    FOR select WHERE false
    FOR create WHERE true
    FOR update WHERE $access = "account" AND id = $auth.id;

DEFINE FIELD name ON user TYPE none | string
PERMISSIONS FOR select WHERE true, FOR create, update WHERE $access = 'account' AND id = $auth.id;

DEFINE FIELD email ON user TYPE none | string
PERMISSIONS FOR select WHERE true, FOR create, update WHERE $access = 'account' AND id = $auth.id;

DEFINE FIELD phone ON user TYPE none | string
PERMISSIONS FOR select WHERE true, FOR create, update WHERE $access = 'account' AND id = $auth.id;

DEFINE FIELD location ON user TYPE none | string
PERMISSIONS FOR select WHERE true, FOR create, update WHERE $access = 'account' AND id = $auth.id;

DEFINE FIELD website ON user TYPE none | string
PERMISSIONS FOR select WHERE true, FOR create, update WHERE $access = 'account' AND id = $auth.id;

DEFINE FIELD profile_picture ON TABLE user TYPE option<string>
PERMISSIONS
    FOR select WHERE true
    FOR create, update WHERE $access = "account" AND id = $auth.id;

DEFINE FIELD created_at ON TABLE user TYPE datetime
VALUE time::now()
PERMISSIONS
    FOR select WHERE false
    FOR create WHERE true
    FOR update WHERE $access = "account" AND id = $auth.id;

DEFINE INDEX unique_username ON TABLE user FIELDS username UNIQUE;

-- ##################################################################
-- CV TABLES
-- ##################################################################

DEFINE TABLE cv_document TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE owner = $auth.id;
DEFINE FIELD title ON cv_document TYPE string ASSERT $value != NONE AND string::len($value) > 0 PERMISSIONS FULL;
DEFINE FIELD owner ON cv_document TYPE record<user> PERMISSIONS FOR select WHERE true, FOR create WHERE $access = 'account', FOR update WHERE false;
DEFINE FIELD theme ON cv_document TYPE none | string PERMISSIONS FULL;
DEFINE FIELD pdf_url ON cv_document TYPE none | string PERMISSIONS FULL;
DEFINE FIELD include_phone ON cv_document TYPE none | bool PERMISSIONS FULL;
DEFINE FIELD section_order ON cv_document TYPE none | array<string> PERMISSIONS FULL;
DEFINE FIELD selected_bullets ON cv_document TYPE none | array<record<bullet_entry>> PERMISSIONS FULL;
DEFINE FIELD selected_education ON cv_document TYPE none | array<record<education_entry>> PERMISSIONS FULL;
DEFINE FIELD selected_experience ON cv_document TYPE none | array<record<experience_entry>> PERMISSIONS FULL;
DEFINE FIELD selected_projects ON cv_document TYPE none | array<record<project_entry>> PERMISSIONS FULL;
DEFINE FIELD selected_skills ON cv_document TYPE none | array<record<skill_entry>> PERMISSIONS FULL;

DEFINE TABLE experience_entry TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE owner = $auth.id;
DEFINE FIELD company ON experience_entry TYPE string ASSERT $value != NONE AND string::len($value) > 0 PERMISSIONS FULL;
DEFINE FIELD position ON experience_entry TYPE none | string PERMISSIONS FULL;
DEFINE FIELD location ON experience_entry TYPE none | string PERMISSIONS FULL;
DEFINE FIELD start_date ON experience_entry TYPE none | string PERMISSIONS FULL;
DEFINE FIELD end_date ON experience_entry TYPE none | string PERMISSIONS FULL;
DEFINE FIELD highlights ON experience_entry TYPE none | array<string> PERMISSIONS FULL;
DEFINE FIELD owner ON experience_entry TYPE record<user> PERMISSIONS FOR select WHERE true, FOR create WHERE $access = 'account', FOR update WHERE false;

DEFINE TABLE education_entry TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE owner = $auth.id;
DEFINE FIELD institution ON education_entry TYPE string ASSERT $value != NONE AND string::len($value) > 0 PERMISSIONS FULL;
DEFINE FIELD degree ON education_entry TYPE none | string PERMISSIONS FULL;
DEFINE FIELD area ON education_entry TYPE none | string PERMISSIONS FULL;
DEFINE FIELD location ON education_entry TYPE none | string PERMISSIONS FULL;
DEFINE FIELD start_date ON education_entry TYPE none | string PERMISSIONS FULL;
DEFINE FIELD end_date ON education_entry TYPE none | string PERMISSIONS FULL;
DEFINE FIELD highlights ON education_entry TYPE none | array<string> PERMISSIONS FULL;
DEFINE FIELD owner ON education_entry TYPE record<user> PERMISSIONS FOR select WHERE true, FOR create WHERE $access = 'account', FOR update WHERE false;

DEFINE TABLE project_entry TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE owner = $auth.id;
DEFINE FIELD name ON project_entry TYPE string ASSERT $value != NONE AND string::len($value) > 0 PERMISSIONS FULL;
DEFINE FIELD location ON project_entry TYPE none | string PERMISSIONS FULL;
DEFINE FIELD start_date ON project_entry TYPE none | string PERMISSIONS FULL;
DEFINE FIELD end_date ON project_entry TYPE none | string PERMISSIONS FULL;
DEFINE FIELD highlights ON project_entry TYPE none | array<string> PERMISSIONS FULL;
DEFINE FIELD owner ON project_entry TYPE record<user> PERMISSIONS FOR select WHERE true, FOR create WHERE $access = 'account', FOR update WHERE false;

DEFINE TABLE skill_entry TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE owner = $auth.id;
DEFINE FIELD label ON skill_entry TYPE string ASSERT $value != NONE AND string::len($value) > 0 PERMISSIONS FULL;
DEFINE FIELD details ON skill_entry TYPE none | string PERMISSIONS FULL;
DEFINE FIELD owner ON skill_entry TYPE record<user> PERMISSIONS FOR select WHERE true, FOR create WHERE $access = 'account', FOR update WHERE false;

DEFINE TABLE bullet_entry TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE owner = $auth.id;
DEFINE FIELD bullet ON bullet_entry TYPE string ASSERT $value != NONE AND string::len($value) > 0 PERMISSIONS FULL;
DEFINE FIELD section_name ON bullet_entry TYPE string ASSERT $value != NONE AND string::len($value) > 0 PERMISSIONS FULL;
DEFINE FIELD sort_order ON bullet_entry TYPE none | int PERMISSIONS FULL;
DEFINE FIELD owner ON bullet_entry TYPE record<user> PERMISSIONS FOR select WHERE true, FOR create WHERE $access = 'account', FOR update WHERE false;

DEFINE TABLE social_network TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE owner = $auth.id;
DEFINE FIELD network ON social_network TYPE string ASSERT $value != NONE AND string::len($value) > 0 PERMISSIONS FULL;
DEFINE FIELD network_username ON social_network TYPE string ASSERT $value != NONE AND string::len($value) > 0 PERMISSIONS FULL;
DEFINE FIELD sort_order ON social_network TYPE none | int PERMISSIONS FULL;
DEFINE FIELD owner ON social_network TYPE record<user> PERMISSIONS FOR select WHERE true, FOR create WHERE $access = 'account', FOR update WHERE false;

-- ##################################################################
-- CHAT & AI
-- ##################################################################

DEFINE TABLE chat_session TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE owner = $auth.id;
DEFINE FIELD title ON chat_session TYPE none | string PERMISSIONS FULL;
DEFINE FIELD created_at ON chat_session TYPE none | datetime VALUE time::now() PERMISSIONS FULL;
DEFINE FIELD owner ON chat_session TYPE record<user> PERMISSIONS FOR select WHERE true, FOR create WHERE $access = 'account', FOR update WHERE false;

DEFINE TABLE chat_message TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE owner = $auth.id;
DEFINE FIELD content ON chat_message TYPE none | string PERMISSIONS FULL;
DEFINE FIELD role ON chat_message TYPE none | string ASSERT $value INSIDE ['user', 'assistant'] PERMISSIONS FULL;
DEFINE FIELD writing ON chat_message TYPE none | bool PERMISSIONS FULL;
DEFINE FIELD job_id ON chat_message TYPE none | string PERMISSIONS FULL;
DEFINE FIELD import_summary ON chat_message TYPE none | object FLEXIBLE PERMISSIONS FULL;
DEFINE FIELD import_result ON chat_message TYPE none | object FLEXIBLE PERMISSIONS FULL;
DEFINE FIELD chat_session ON chat_message TYPE record<chat_session> PERMISSIONS FULL;
DEFINE FIELD owner ON chat_message TYPE record<user> PERMISSIONS FOR select WHERE true, FOR create WHERE $access = 'account', FOR update WHERE false;
DEFINE FIELD created_at ON chat_message TYPE none | datetime VALUE time::now() PERMISSIONS FULL;

DEFINE TABLE chat_file SCHEMAFULL
PERMISSIONS
  FOR select WHERE chat_message.owner = $auth.id
  FOR create, update WHERE $auth.id != NONE
  FOR delete WHERE chat_message.owner = $auth.id;

DEFINE FIELD chat_message ON TABLE chat_file TYPE record<chat_message> PERMISSIONS FULL;
DEFINE FIELD name ON TABLE chat_file TYPE string PERMISSIONS FULL;
DEFINE FIELD path ON TABLE chat_file TYPE string PERMISSIONS FULL;

DEFINE BUCKET chat_documents BACKEND 'memory' PERMISSIONS WHERE $action NOTINSIDE ['put'] OR file::head($file).size <= 15728640 AND (string::ends_with(file::key($file), '.jpg') OR string::ends_with(file::key($file), '.jpeg') OR string::ends_with(file::key($file), '.png') OR string::ends_with(file::key($file), '.csv') OR string::ends_with(file::key($file), '.pdf') OR string::ends_with(file::key($file), '.txt'));

-- ##################################################################
-- JOB TABLES
-- ##################################################################

DEFINE TABLE jobs_render TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE true;
DEFINE FIELD path ON jobs_render TYPE string PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD payload ON jobs_render TYPE any PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD assigned_to ON jobs_render TYPE record PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD status ON jobs_render TYPE string DEFAULT ALWAYS 'pending' ASSERT $value INSIDE ['pending', 'processing', 'success', 'failed'] PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD retries ON jobs_render TYPE int DEFAULT ALWAYS 0 PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD max_retries ON jobs_render TYPE int DEFAULT ALWAYS 3 PERMISSIONS FULL;
DEFINE FIELD retry_strategy ON jobs_render TYPE string DEFAULT ALWAYS 'linear' ASSERT $value INSIDE ['linear', 'exponential'] PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD errors ON jobs_render TYPE array<object> DEFAULT ALWAYS [] PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD created_at ON jobs_render TYPE datetime VALUE time::now() PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD updated_at ON jobs_render TYPE datetime DEFAULT ALWAYS time::now() PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;

DEFINE TABLE jobs_agent TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE true;
DEFINE FIELD path ON jobs_agent TYPE string PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD payload ON jobs_agent TYPE any PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD assigned_to ON jobs_agent TYPE record PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD status ON jobs_agent TYPE string DEFAULT ALWAYS 'pending' ASSERT $value INSIDE ['pending', 'processing', 'success', 'failed'] PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD retries ON jobs_agent TYPE int DEFAULT ALWAYS 0 PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD max_retries ON jobs_agent TYPE int DEFAULT ALWAYS 3 PERMISSIONS FULL;
DEFINE FIELD retry_strategy ON jobs_agent TYPE string DEFAULT ALWAYS 'linear' ASSERT $value INSIDE ['linear', 'exponential'] PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD errors ON jobs_agent TYPE array<object> DEFAULT ALWAYS [] PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD created_at ON jobs_agent TYPE datetime VALUE time::now() PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD updated_at ON jobs_agent TYPE datetime DEFAULT ALWAYS time::now() PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
