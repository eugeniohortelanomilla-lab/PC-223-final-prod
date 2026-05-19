-- Railway / hosted MySQL: run this in the database Railway already created.
-- (Do not run CREATE DATABASE — the plugin provisions the DB name for you.)

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(150) NOT NULL,
  role ENUM('admin','Student','Faculty') NOT NULL DEFAULT 'Student',
  created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS borrow_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  username VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  id_num VARCHAR(100) NOT NULL,
  course VARCHAR(150) DEFAULT NULL,
  section VARCHAR(150) DEFAULT NULL,
  book_title VARCHAR(255) NOT NULL,
  book_author VARCHAR(255) DEFAULT NULL,
  date_needed DATE NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  submitted_at DATETIME NOT NULL,
  approved_at DATETIME DEFAULT NULL,
  returned_at DATETIME DEFAULT NULL,
  rejection_reason VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  username VARCHAR(100) NOT NULL,
  facility VARCHAR(255) NOT NULL,
  name VARCHAR(150) NOT NULL,
  sid VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  time_slot VARCHAR(100) NOT NULL,
  pax INT NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  created_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO users (username, password, name, role, created_at) VALUES
('admin', '$2y$10$ZpWmY/oYHtmY38/zZuy0eOtx9a5ycDWL2SOKXh5mWHbwtDF4xrJZi', 'Administrator', 'admin', NOW());
-- password: admin123
