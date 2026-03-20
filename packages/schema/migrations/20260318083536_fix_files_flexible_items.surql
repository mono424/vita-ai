-- Migration: fix_files_flexible_items
-- Created: 2026-03-18T08:35:36+00:00

-- Re-apply with FLEXIBLE on the array<object> field
DEFINE FIELD OVERWRITE files ON TABLE chat_message TYPE option<array<object>> FLEXIBLE
PERMISSIONS FULL;
