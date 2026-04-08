-- Migration: small_updates
-- Created: 2026-04-08T14:15:19.409445+00:00

-- Modified
DEFINE FIELD OVERWRITE assigned_to ON jobs_agent TYPE record<chat_message> PERMISSIONS FOR select, create WHERE true, FOR update WHERE false;
DEFINE FIELD OVERWRITE errors ON jobs_render TYPE array<object> DEFAULT ALWAYS [] PERMISSIONS FOR select, update WHERE false, FOR create WHERE true;
DEFINE EVENT OVERWRITE _00_dbsp_cleanup ON _00_query WHEN $event = 'DELETE' THEN { LET $payload = { id: <string> $before.id }; LET $result = http::post($sp00ky_endpoint + '/view/unregister', $payload, { Authorization: 'Bearer ' + $sp00ky_secret }); };
