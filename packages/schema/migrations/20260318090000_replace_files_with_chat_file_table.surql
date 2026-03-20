-- Migration: replace_files_with_chat_file_table
-- Created: 2026-03-18T09:00:00+00:00

-- Remove the embedded files field from chat_message
REMOVE FIELD files ON TABLE chat_message;

-- Create chat_file table for 1:n relation
DEFINE TABLE chat_file SCHEMAFULL
PERMISSIONS
  FOR select WHERE chat_message.owner = $auth.id
  FOR create, update WHERE $auth.id != NONE
  FOR delete WHERE chat_message.owner = $auth.id;

DEFINE FIELD chat_message ON TABLE chat_file TYPE record<chat_message>
PERMISSIONS FULL;

DEFINE FIELD name ON TABLE chat_file TYPE string
PERMISSIONS FULL;

DEFINE FIELD path ON TABLE chat_file TYPE string
PERMISSIONS FULL;
