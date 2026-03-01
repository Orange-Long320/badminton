-- Badminton Ranking System Database Schema
-- Run this script to initialize the database

CREATE DATABASE IF NOT EXISTS badminton_ranking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE badminton_ranking;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50),
  avatar_url VARCHAR(255),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  name VARCHAR(50) NOT NULL,
  avatar VARCHAR(255),
  points INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  signature VARCHAR(255),
  play_type ENUM('singles', 'doubles', 'both') DEFAULT 'both',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_name (name),
  INDEX idx_points (points)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Doubles teams table
CREATE TABLE IF NOT EXISTS doubles_teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  player1_id INT NOT NULL,
  player2_id INT NOT NULL,
  points INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (player1_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (player2_id) REFERENCES players(id) ON DELETE CASCADE,
  INDEX idx_player1 (player1_id),
  INDEX idx_player2 (player2_id),
  INDEX idx_points (points)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('singles', 'doubles') NOT NULL,
  team1_id INT,
  team2_id INT,
  team1_score INT NOT NULL,
  team2_score INT NOT NULL,
  winner ENUM('team1', 'team2', 'draw') NOT NULL,
  match_date DATE NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_type (type),
  INDEX idx_match_date (match_date),
  INDEX idx_team1 (team1_id),
  INDEX idx_team2 (team2_id),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Match doubles players table (records which players participated in doubles matches)
CREATE TABLE IF NOT EXISTS match_doubles_players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  team ENUM('team1', 'team2') NOT NULL,
  player_id INT NOT NULL,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  INDEX idx_match_id (match_id),
  INDEX idx_player_id (player_id),
  INDEX idx_team (team)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: No default users are created for security reasons.
-- Please register a new user through the /api/auth/register endpoint.
