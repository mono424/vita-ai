-- ##################################################################
-- SCOPES & AUTHENTICATION
-- ##################################################################

DEFINE ACCESS account ON DATABASE TYPE RECORD
  SIGNUP ( CREATE user SET username = $username, password = crypto::argon2::generate($password) )
  SIGNIN ( SELECT * FROM user WHERE username = $username AND crypto::argon2::compare(password, $password) )
  DURATION FOR TOKEN 15m, FOR SESSION 30d
;

-- ##################################################################
-- USER TABLE
-- ##################################################################

DEFINE TABLE user SCHEMAFULL
PERMISSIONS
  FOR update, delete WHERE $access = "account" AND id = $auth.id
  FOR create, select WHERE true;

DEFINE FIELD username ON TABLE user TYPE string
ASSERT $value != NONE AND string::len($value) > 3
PERMISSIONS
    FOR select WHERE true
    FOR create WHERE true
    FOR update WHERE $access = "account" AND id = $auth.id;

DEFINE INDEX unique_username ON TABLE user FIELDS username UNIQUE;

DEFINE FIELD password ON TABLE user TYPE string
ASSERT $value != NONE AND string::len($value) > 0
PERMISSIONS
    FOR select WHERE false
    FOR create WHERE true
    FOR update WHERE $access = "account" AND id = $auth.id;

DEFINE FIELD created_at ON TABLE user TYPE datetime
VALUE time::now()
PERMISSIONS
    FOR select WHERE false
    FOR create WHERE true
    FOR update WHERE $access = "account" AND id = $auth.id;

DEFINE FIELD profile_picture ON TABLE user TYPE option<string>
PERMISSIONS
    FOR select WHERE true
    FOR create, update WHERE $access = "account" AND id = $auth.id;

DEFINE FIELD name ON TABLE user TYPE option<string>
PERMISSIONS
    FOR select WHERE true
    FOR create, update WHERE $access = "account" AND id = $auth.id;

DEFINE FIELD location ON TABLE user TYPE option<string>
PERMISSIONS
    FOR select WHERE true
    FOR create, update WHERE $access = "account" AND id = $auth.id;

DEFINE FIELD email ON TABLE user TYPE option<string>
PERMISSIONS
    FOR select WHERE true
    FOR create, update WHERE $access = "account" AND id = $auth.id;

DEFINE FIELD phone ON TABLE user TYPE option<string>
PERMISSIONS
    FOR select WHERE true
    FOR create, update WHERE $access = "account" AND id = $auth.id;

DEFINE FIELD website ON TABLE user TYPE option<string>
PERMISSIONS
    FOR select WHERE true
    FOR create, update WHERE $access = "account" AND id = $auth.id;

-- ##################################################################
-- SOCIAL NETWORK TABLE
-- ##################################################################

DEFINE TABLE social_network SCHEMAFULL
PERMISSIONS
  FOR select, create, update, delete WHERE owner = $auth.id;

DEFINE FIELD owner ON TABLE social_network TYPE record<user>
PERMISSIONS
    FOR select WHERE true
    FOR create WHERE $access = "account"
    FOR update WHERE false;

DEFINE FIELD network ON TABLE social_network TYPE string
ASSERT $value != NONE AND string::len($value) > 0
PERMISSIONS FULL;

DEFINE FIELD network_username ON TABLE social_network TYPE string
ASSERT $value != NONE AND string::len($value) > 0
PERMISSIONS FULL;

DEFINE FIELD sort_order ON TABLE social_network TYPE option<int>
PERMISSIONS FULL;

-- ##################################################################
-- EDUCATION ENTRY TABLE
-- ##################################################################

DEFINE TABLE education_entry SCHEMAFULL
PERMISSIONS
  FOR select, create, update, delete WHERE owner = $auth.id;

DEFINE FIELD owner ON TABLE education_entry TYPE record<user>
PERMISSIONS
    FOR select WHERE true
    FOR create WHERE $access = "account"
    FOR update WHERE false;

DEFINE FIELD institution ON TABLE education_entry TYPE string
ASSERT $value != NONE AND string::len($value) > 0
PERMISSIONS FULL;

DEFINE FIELD area ON TABLE education_entry TYPE option<string>
PERMISSIONS FULL;

DEFINE FIELD degree ON TABLE education_entry TYPE option<string>
PERMISSIONS FULL;

DEFINE FIELD start_date ON TABLE education_entry TYPE option<string>
PERMISSIONS FULL;

DEFINE FIELD end_date ON TABLE education_entry TYPE option<string>
PERMISSIONS FULL;

DEFINE FIELD location ON TABLE education_entry TYPE option<string>
PERMISSIONS FULL;

DEFINE FIELD highlights ON TABLE education_entry TYPE option<array<string>>
PERMISSIONS FULL;

-- ##################################################################
-- EXPERIENCE ENTRY TABLE
-- ##################################################################

DEFINE TABLE experience_entry SCHEMAFULL
PERMISSIONS
  FOR select, create, update, delete WHERE owner = $auth.id;

DEFINE FIELD owner ON TABLE experience_entry TYPE record<user>
PERMISSIONS
    FOR select WHERE true
    FOR create WHERE $access = "account"
    FOR update WHERE false;

DEFINE FIELD company ON TABLE experience_entry TYPE string
ASSERT $value != NONE AND string::len($value) > 0
PERMISSIONS FULL;

DEFINE FIELD position ON TABLE experience_entry TYPE option<string>
PERMISSIONS FULL;

DEFINE FIELD start_date ON TABLE experience_entry TYPE option<string>
PERMISSIONS FULL;

DEFINE FIELD end_date ON TABLE experience_entry TYPE option<string>
PERMISSIONS FULL;

DEFINE FIELD location ON TABLE experience_entry TYPE option<string>
PERMISSIONS FULL;

DEFINE FIELD highlights ON TABLE experience_entry TYPE option<array<string>>
PERMISSIONS FULL;

-- ##################################################################
-- PROJECT ENTRY TABLE
-- ##################################################################

DEFINE TABLE project_entry SCHEMAFULL
PERMISSIONS
  FOR select, create, update, delete WHERE owner = $auth.id;

DEFINE FIELD owner ON TABLE project_entry TYPE record<user>
PERMISSIONS
    FOR select WHERE true
    FOR create WHERE $access = "account"
    FOR update WHERE false;

DEFINE FIELD name ON TABLE project_entry TYPE string
ASSERT $value != NONE AND string::len($value) > 0
PERMISSIONS FULL;

DEFINE FIELD start_date ON TABLE project_entry TYPE option<string>
PERMISSIONS FULL;

DEFINE FIELD end_date ON TABLE project_entry TYPE option<string>
PERMISSIONS FULL;

DEFINE FIELD location ON TABLE project_entry TYPE option<string>
PERMISSIONS FULL;

DEFINE FIELD highlights ON TABLE project_entry TYPE option<array<string>>
PERMISSIONS FULL;

-- ##################################################################
-- SKILL ENTRY TABLE
-- ##################################################################

DEFINE TABLE skill_entry SCHEMAFULL
PERMISSIONS
  FOR select, create, update, delete WHERE owner = $auth.id;

DEFINE FIELD owner ON TABLE skill_entry TYPE record<user>
PERMISSIONS
    FOR select WHERE true
    FOR create WHERE $access = "account"
    FOR update WHERE false;

DEFINE FIELD label ON TABLE skill_entry TYPE string
ASSERT $value != NONE AND string::len($value) > 0
PERMISSIONS FULL;

DEFINE FIELD details ON TABLE skill_entry TYPE option<string>
PERMISSIONS FULL;

-- ##################################################################
-- BULLET ENTRY TABLE
-- ##################################################################

DEFINE TABLE bullet_entry SCHEMAFULL
PERMISSIONS
  FOR select, create, update, delete WHERE owner = $auth.id;

DEFINE FIELD owner ON TABLE bullet_entry TYPE record<user>
PERMISSIONS
    FOR select WHERE true
    FOR create WHERE $access = "account"
    FOR update WHERE false;

DEFINE FIELD section_name ON TABLE bullet_entry TYPE string
ASSERT $value != NONE AND string::len($value) > 0
PERMISSIONS FULL;

DEFINE FIELD bullet ON TABLE bullet_entry TYPE string
ASSERT $value != NONE AND string::len($value) > 0
PERMISSIONS FULL;

DEFINE FIELD sort_order ON TABLE bullet_entry TYPE option<int>
PERMISSIONS FULL;

-- ##################################################################
-- CHAT MESSAGE TABLE
-- ##################################################################

DEFINE TABLE chat_message SCHEMAFULL
PERMISSIONS
  FOR select, create, update, delete WHERE owner = $auth.id;

DEFINE FIELD owner ON TABLE chat_message TYPE option<record<user>>
PERMISSIONS
    FOR select WHERE true
    FOR create WHERE $access = "account"
    FOR update WHERE false;

DEFINE FIELD role ON TABLE chat_message TYPE option<string>
ASSERT $value IN ["user", "assistant"]
PERMISSIONS FULL;

DEFINE FIELD content ON TABLE chat_message TYPE option<string>
PERMISSIONS FULL;

DEFINE FIELD writing ON TABLE chat_message TYPE option<bool>
PERMISSIONS FULL;

DEFINE FIELD job_id ON TABLE chat_message TYPE option<string>
PERMISSIONS FULL;

DEFINE FIELD import_summary ON TABLE chat_message TYPE option<object> FLEXIBLE
PERMISSIONS FULL;

DEFINE FIELD created_at ON TABLE chat_message TYPE option<datetime>
VALUE time::now()
PERMISSIONS FULL;

-- ##################################################################
-- CV DOCUMENT TABLE
-- ##################################################################

DEFINE TABLE cv_document SCHEMAFULL
PERMISSIONS
  FOR select, create, update, delete WHERE owner = $auth.id;

DEFINE FIELD owner ON TABLE cv_document TYPE record<user>
PERMISSIONS
    FOR select WHERE true
    FOR create WHERE $access = "account"
    FOR update WHERE false;

DEFINE FIELD title ON TABLE cv_document TYPE string
ASSERT $value != NONE AND string::len($value) > 0
PERMISSIONS FULL;

DEFINE FIELD theme ON TABLE cv_document TYPE option<string>
PERMISSIONS FULL;

DEFINE FIELD section_order ON TABLE cv_document TYPE option<array<string>>
PERMISSIONS FULL;

DEFINE FIELD selected_education ON TABLE cv_document TYPE option<array<record<education_entry>>>
PERMISSIONS FULL;

DEFINE FIELD selected_experience ON TABLE cv_document TYPE option<array<record<experience_entry>>>
PERMISSIONS FULL;

DEFINE FIELD selected_projects ON TABLE cv_document TYPE option<array<record<project_entry>>>
PERMISSIONS FULL;

DEFINE FIELD selected_skills ON TABLE cv_document TYPE option<array<record<skill_entry>>>
PERMISSIONS FULL;

DEFINE FIELD selected_bullets ON TABLE cv_document TYPE option<array<record<bullet_entry>>>
PERMISSIONS FULL;

DEFINE FIELD include_phone ON TABLE cv_document TYPE option<bool>
PERMISSIONS FULL;

DEFINE FIELD pdf_url ON TABLE cv_document TYPE option<string>
PERMISSIONS FULL;

