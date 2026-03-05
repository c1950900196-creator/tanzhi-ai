CREATE DATABASE IF NOT EXISTS tanzhi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tanzhi;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50),
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_role VARCHAR(50) NOT NULL,
  tags TEXT NOT NULL,
  heat VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  summary TEXT NOT NULL,
  gradient VARCHAR(255) NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_avatar VARCHAR(50) NOT NULL,
  author_color VARCHAR(20) NOT NULL,
  author_title VARCHAR(200) NOT NULL,
  ai_first_message TEXT NOT NULL,
  quick_replies TEXT NOT NULL,
  source VARCHAR(50) DEFAULT 'ai_generated',
  source_url VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS card_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  card_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  source VARCHAR(50),
  meta TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_events_user (user_id),
  INDEX idx_events_type (event_type),
  INDEX idx_events_user_type (user_id, event_type)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tag_library (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100),
  embedding LONGTEXT,
  usage_count INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tags_name (name),
  INDEX idx_tags_usage (usage_count)
) ENGINE=InnoDB;

CREATE INDEX idx_cards_source ON cards(source);
CREATE INDEX idx_cards_role ON cards(target_role);
CREATE INDEX idx_cards_created ON cards(created_at);
