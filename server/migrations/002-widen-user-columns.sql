-- Lets the profile fields hold longer text. Safe to run on a database that already has these changes.
ALTER TABLE users MODIFY phone VARCHAR(255) NULL DEFAULT '';
ALTER TABLE users MODIFY organisation VARCHAR(255) NULL DEFAULT '';
ALTER TABLE users MODIFY country VARCHAR(255) NULL DEFAULT '';
ALTER TABLE users MODIFY city VARCHAR(255) NULL DEFAULT '';
ALTER TABLE users MODIFY delivery_location TEXT NULL;
