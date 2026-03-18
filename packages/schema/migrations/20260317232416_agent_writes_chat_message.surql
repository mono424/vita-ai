-- Migration: agent_writes_chat_message
-- Created: 2026-03-17T23:24:17.629480+00:00

-- Added
DEFINE FIELD import_result ON chat_message TYPE none | object FLEXIBLE PERMISSIONS FULL;
