-- ##################################################################
-- AGENT API OUTBOX TABLE
-- ##################################################################

DEFINE TABLE jobs_agent SCHEMAFULL
PERMISSIONS
  FOR select, create, update, delete WHERE true;

DEFINE FIELD assigned_to ON TABLE jobs_agent TYPE record<chat_message>
PERMISSIONS
  FOR create, select WHERE true
  FOR update WHERE false;

DEFINE FIELD path ON TABLE jobs_agent TYPE string
PERMISSIONS
  FOR create, select WHERE true
  FOR update WHERE false;

DEFINE FIELD payload ON TABLE jobs_agent TYPE any
PERMISSIONS
  FOR create, select WHERE true
  FOR update WHERE false;

DEFINE FIELD retries ON TABLE jobs_agent TYPE int DEFAULT ALWAYS 0
PERMISSIONS
  FOR create, select WHERE true
  FOR update WHERE false;

DEFINE FIELD max_retries ON TABLE jobs_agent TYPE int DEFAULT ALWAYS 3;

DEFINE FIELD retry_strategy ON TABLE jobs_agent TYPE string DEFAULT ALWAYS "linear"
ASSERT $value IN ["linear", "exponential"]
PERMISSIONS
  FOR create, select WHERE true
  FOR update WHERE false;

DEFINE FIELD status ON TABLE jobs_agent TYPE string DEFAULT ALWAYS "pending"
ASSERT $value IN ["pending", "processing", "success", "failed"]
PERMISSIONS
  FOR create, select WHERE true
  FOR update WHERE false;

DEFINE FIELD errors ON TABLE jobs_agent TYPE array<object> DEFAULT ALWAYS []
PERMISSIONS
  FOR create WHERE true
  FOR select WHERE true
  FOR update WHERE false;

DEFINE FIELD updated_at ON TABLE jobs_agent TYPE datetime
DEFAULT ALWAYS time::now()
PERMISSIONS
  FOR create, select WHERE true
  FOR update WHERE false;

DEFINE FIELD created_at ON TABLE jobs_agent TYPE datetime
VALUE time::now()
PERMISSIONS
  FOR create, select WHERE true
  FOR update WHERE false;
