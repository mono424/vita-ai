-- Migration: add_file_bucket
-- Created: 2026-03-18T08:05:04.847697+00:00

-- Removed
REMOVE FIELD session ON TABLE chat_message;

-- Added
DEFINE BUCKET chat_documents BACKEND 'memory' PERMISSIONS WHERE $action NOTINSIDE ['put'] OR file::head($file).size <= 15728640 AND (string::ends_with(file::key($file), '.jpg') OR string::ends_with(file::key($file), '.jpeg') OR string::ends_with(file::key($file), '.png') OR string::ends_with(file::key($file), '.csv') OR string::ends_with(file::key($file), '.pdf') OR string::ends_with(file::key($file), '.txt'));
