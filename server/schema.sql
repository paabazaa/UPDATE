-- SURGICISS website database (MySQL 8 / MariaDB 10.5+).
-- Run with: npm run db:migrate   (safe to run more than once)

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  email VARCHAR(254) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL DEFAULT '',
  organisation VARCHAR(255) NOT NULL DEFAULT '',
  country VARCHAR(255) NOT NULL DEFAULT '',
  city VARCHAR(255) NOT NULL DEFAULT '',
  delivery_location VARCHAR(500) NOT NULL DEFAULT '',
  avatar MEDIUMTEXT NULL,
  password_hash VARCHAR(255) NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(64) NOT NULL,
  user_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Google and Facebook sign-ins linked to an account. password_hash is NULL for people who only use them.
CREATE TABLE IF NOT EXISTS oauth_identities (
  provider VARCHAR(20) NOT NULL,
  provider_user_id VARCHAR(191) NOT NULL,
  user_id CHAR(36) NOT NULL,
  email VARCHAR(254) NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (provider, provider_user_id),
  KEY idx_oauth_user (user_id),
  CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Short-lived records for sign-ins in progress (one per click on "Continue with ...").
CREATE TABLE IF NOT EXISTS oauth_states (
  id CHAR(64) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  verifier VARCHAR(128) NOT NULL,
  next_path VARCHAR(300) NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_oauth_states_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_resets (
  id CHAR(64) NOT NULL,
  user_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_resets_user (user_id),
  CONSTRAINT fk_resets_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotes (
  id CHAR(36) NOT NULL,
  reference VARCHAR(32) NOT NULL,
  user_id CHAR(36) NULL,
  contact_email VARCHAR(254) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'received',
  payload JSON NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_quotes_reference (reference),
  KEY idx_quotes_user (user_id, created_at),
  KEY idx_quotes_email (contact_email),
  CONSTRAINT fk_quotes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enquiries (
  id CHAR(36) NOT NULL,
  reference VARCHAR(32) NOT NULL,
  user_id CHAR(36) NULL,
  contact_email VARCHAR(254) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'received',
  payload JSON NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_enquiries_reference (reference),
  KEY idx_enquiries_user (user_id, created_at),
  KEY idx_enquiries_email (contact_email),
  CONSTRAINT fk_enquiries_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email VARCHAR(254) NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
