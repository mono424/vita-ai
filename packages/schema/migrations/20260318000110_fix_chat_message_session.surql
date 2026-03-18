-- Migration: fix_chat_message_session
-- Created: 2026-03-18T00:01:12.482393+00:00

-- Modified: make session non-optional
DEFINE FIELD OVERWRITE session ON chat_message TYPE record<chat_session> PERMISSIONS FULL;
