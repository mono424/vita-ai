-- Migration: add_files_to_chat
-- Created: 2026-03-18T07:59:00.452038+00:00

-- Added
DEFINE FIELD files ON chat_message TYPE none | array<object> FLEXIBLE PERMISSIONS FULL;
