-- Migration: fix_chat_message_owner
-- Created: 2026-03-17T23:59:28.316426+00:00

-- Modified: make owner non-optional
DEFINE FIELD OVERWRITE owner ON chat_message TYPE record<user> PERMISSIONS FOR select WHERE true, FOR create WHERE $access = 'account', FOR update WHERE false;
