-- Migration: add_chat_sessions
-- Created: 2026-03-16T17:55:09.800773+00:00

-- Added
DEFINE TABLE chat_session TYPE NORMAL SCHEMAFULL PERMISSIONS FOR select, create, update, delete WHERE owner = $auth.id;
DEFINE FIELD session ON chat_message TYPE none | record<chat_session> PERMISSIONS FULL;
DEFINE FIELD created_at ON chat_session TYPE none | datetime VALUE time::now() PERMISSIONS FULL;
DEFINE FIELD owner ON chat_session TYPE record<user> PERMISSIONS FOR select WHERE true, FOR create WHERE $access = 'account', FOR update WHERE false;
DEFINE FIELD title ON chat_session TYPE none | string PERMISSIONS FULL;
