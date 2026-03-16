-- Migration: initial
-- Created: 2026-03-15T09:12:36.902915+00:00

-- Added
-- ##################################################################
-- SCOPES & AUTHENTICATION
-- ##################################################################

DEFINE ACCESS account ON DATABASE TYPE RECORD
  SIGNUP ( CREATE user SET username = $username, password = crypto::argon2::generate($password) )
  SIGNIN ( SELECT * FROM user WHERE username = $username AND crypto::argon2::compare(password, $password) )
  DURATION FOR TOKEN 15m, FOR SESSION 30d
;
-- ==================================================
-- SPOOKY LIST REF
-- The current list of results for a query/incantation
-- ==================================================

DEFINE TABLE _spooky_list_ref SCHEMALESS
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE TABLE IF NOT EXISTS _spooky_migrations SCHEMAFULL PERMISSIONS NONE;
-- ==================================================
-- SPOOKY STREAM PROCESSOR STATE
-- Stores the local state of the stream processor (DBSP)
-- ==================================================

-- Remote-only meta tables (not synced to client)
DEFINE TABLE _spooky_module_state SCHEMALESS PERMISSIONS FULL;
-- ==================================================
-- SPOOKY INCANTATION
-- The Registry of active Live Queries (Incantations).
-- Moved to meta_tables_client.surql and meta_tables_remote.surql
-- ==================================================

-- ==================================================
-- SPOOKY INCANTATION
-- The Registry of active Live Queries (Incantations).
-- ==================================================

DEFINE TABLE _spooky_query SCHEMALESS
    PERMISSIONS FOR select, create, update WHERE true;
-- Note: Registration is now handled explicitly by fn::query::register calling mod::dbsp::register_view
-- The previous _spooky_dbsp_register event is removed to prevent recursion and double-registration.

-- ==================================================
-- SPOOKY VERSION
-- Tracks the version of every record for sync.
-- ==================================================
DEFINE TABLE _spooky_version SCHEMALESS
    PERMISSIONS FOR select WHERE true;
-- ##################################################################
-- USER TABLE
-- ##################################################################

DEFINE TABLE user SCHEMAFULL
PERMISSIONS
  FOR update, delete WHERE $access = "account" AND id = $auth.id
  FOR create, select WHERE true;
DEFINE FIELD clientId ON TABLE _spooky_list_ref TYPE string
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD in ON TABLE _spooky_list_ref TYPE record
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD out ON TABLE _spooky_list_ref TYPE record
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD parent ON TABLE _spooky_list_ref TYPE option<record<_spooky_list_ref>>
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD parent_rel ON TABLE _spooky_list_ref TYPE option<string>
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD updatedAt ON TABLE _spooky_list_ref TYPE datetime VALUE time::now() READONLY
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD version ON TABLE _spooky_list_ref TYPE int
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD IF NOT EXISTS applied_at ON _spooky_migrations TYPE datetime VALUE time::now();
DEFINE FIELD IF NOT EXISTS checksum ON _spooky_migrations TYPE string;
DEFINE FIELD IF NOT EXISTS name ON _spooky_migrations TYPE string;
DEFINE FIELD IF NOT EXISTS version ON _spooky_migrations TYPE string;
-- The raw query string (for re-hydration/debugging)
DEFINE FIELD clientId ON TABLE _spooky_query TYPE option<string>
    PERMISSIONS FOR select, create, update WHERE true;
-- For garbage collection (Heartbeat)
DEFINE FIELD lastActiveAt ON TABLE _spooky_query TYPE datetime DEFAULT time::now()
    PERMISSIONS FOR select, create, update WHERE true;
-- The raw query string (for re-hydration/debugging)
-- The raw query string (for re-hydration/debugging)
DEFINE FIELD surql ON TABLE _spooky_query TYPE option<string>
    PERMISSIONS FOR select, create, update WHERE true;
-- How long this Incantation stays alive without activity
DEFINE FIELD ttl ON TABLE _spooky_query TYPE duration
    PERMISSIONS FOR select, create, update WHERE true;
DEFINE FIELD record_id ON TABLE _spooky_version TYPE record;
DEFINE FIELD version ON TABLE _spooky_version TYPE int;
DEFINE FIELD created_at ON TABLE user TYPE datetime
VALUE time::now()
PERMISSIONS
    FOR select WHERE false
    FOR create WHERE true
    FOR update WHERE $access = "account" AND id = $auth.id;
DEFINE FIELD password ON TABLE user TYPE string
ASSERT $value != NONE AND string::len($value) > 0
PERMISSIONS
    FOR select WHERE false
    FOR create WHERE true
    FOR update WHERE $access = "account" AND id = $auth.id;
DEFINE FIELD profile_picture ON TABLE user TYPE option<string>
PERMISSIONS
    FOR select WHERE true
    FOR create, update WHERE $access = "account" AND id = $auth.id;
DEFINE FIELD username ON TABLE user TYPE string
ASSERT $value != NONE AND string::len($value) > 3
PERMISSIONS
    FOR select WHERE true
    FOR create WHERE true
    FOR update WHERE $access = "account" AND id = $auth.id;
DEFINE INDEX IF NOT EXISTS idx_version ON _spooky_migrations FIELDS version UNIQUE;
DEFINE INDEX idx_record_id ON TABLE _spooky_version COLUMNS record_id UNIQUE;
DEFINE INDEX unique_username ON TABLE user FIELDS username UNIQUE;
-- Unregister from DBSP on deletion
-- Unregister from DBSP on deletion
DEFINE EVENT _spooky_dbsp_cleanup ON TABLE _spooky_query WHEN $event = "DELETE" THEN {
    let $payload = { id: <string>$before.id };
    let $result = http::post('http://localhost:8667/view/unregister', $payload, { "Authorization": "Bearer " });
};
