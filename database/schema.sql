-- ====================================================================
-- ECHO — Music Discovery Platform Database Schema
-- BTech 5th Semester Web Technology Project (MIT Manipal / ICT3131)
-- Target RDBMS: MySQL 8.0+ / MariaDB 10.4+ (XAMPP Default)
-- Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS recent_tracks;
DROP TABLE IF EXISTS saved_artists;
DROP TABLE IF EXISTS liked_tracks;
DROP TABLE IF EXISTS playlist_tracks;
DROP TABLE IF EXISTS playlists;
DROP TABLE IF EXISTS track_genres;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS track_artists;
DROP TABLE IF EXISTS tracks;
DROP TABLE IF EXISTS albums;
DROP TABLE IF EXISTS artists;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------------------
-- 1. USERS: User authentication & profile accounts
-- --------------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. ARTISTS: Music creators & collective profiles
-- --------------------------------------------------------------------
CREATE TABLE artists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bio TEXT,
    image_url VARCHAR(255) NOT NULL,
    is_verified TINYINT(1) DEFAULT 1,
    monthly_listeners INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_artist_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. ALBUMS: Long-play, EP, and Single collections
-- --------------------------------------------------------------------
CREATE TABLE albums (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    artist_id INT NOT NULL,
    release_date DATE NOT NULL,
    cover_url VARCHAR(255) NOT NULL,
    album_type ENUM('album', 'ep', 'single') DEFAULT 'album',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_album_artist FOREIGN KEY (artist_id) 
        REFERENCES artists(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_album_title (title),
    INDEX idx_album_artist (artist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. TRACKS: Individual catalogue songs & 30s preview streams
-- --------------------------------------------------------------------
CREATE TABLE tracks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    album_id INT NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 30,
    preview_url VARCHAR(255) NOT NULL,
    plays_count INT NOT NULL DEFAULT 0,
    release_date DATE NOT NULL,
    is_staff_pick TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_track_album FOREIGN KEY (album_id) 
        REFERENCES albums(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_track_title (title),
    INDEX idx_track_plays (plays_count),
    INDEX idx_track_staff_pick (is_staff_pick)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. TRACK_ARTISTS: Support for primary artists & featured collaborations
-- --------------------------------------------------------------------
CREATE TABLE track_artists (
    track_id INT NOT NULL,
    artist_id INT NOT NULL,
    role ENUM('primary', 'featured') DEFAULT 'primary',
    PRIMARY KEY (track_id, artist_id),
    CONSTRAINT fk_ta_track FOREIGN KEY (track_id) 
        REFERENCES tracks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ta_artist FOREIGN KEY (artist_id) 
        REFERENCES artists(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_ta_artist (artist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 6. GENRES: Genre categories and thematic tags
-- --------------------------------------------------------------------
CREATE TABLE genres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    color_accent VARCHAR(7) DEFAULT '#B49AFF',
    description VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 7. TRACK_GENRES: Many-to-many track to genre associations
-- --------------------------------------------------------------------
CREATE TABLE track_genres (
    track_id INT NOT NULL,
    genre_id INT NOT NULL,
    PRIMARY KEY (track_id, genre_id),
    CONSTRAINT fk_tg_track FOREIGN KEY (track_id) 
        REFERENCES tracks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tg_genre FOREIGN KEY (genre_id) 
        REFERENCES genres(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_tg_genre (genre_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 8. PLAYLISTS: User-created personal track collections (Student 2)
-- --------------------------------------------------------------------
CREATE TABLE playlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    cover_url VARCHAR(255) DEFAULT 'assets/images/default-cover.svg',
    is_public TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_playlist_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_playlist_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 9. PLAYLIST_TRACKS: Ordered song memberships in playlists
--    Note: Deleting a playlist never deletes catalogue tracks.
-- --------------------------------------------------------------------
CREATE TABLE playlist_tracks (
    playlist_id INT NOT NULL,
    track_id INT NOT NULL,
    position INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, track_id),
    CONSTRAINT fk_pt_playlist FOREIGN KEY (playlist_id) 
        REFERENCES playlists(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pt_track FOREIGN KEY (track_id) 
        REFERENCES tracks(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_pt_track (track_id),
    INDEX idx_pt_order (playlist_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 10. LIKED_TRACKS: User liked songs library collection (Student 2)
--     Uniqueness enforced by compound primary key.
-- --------------------------------------------------------------------
CREATE TABLE liked_tracks (
    user_id INT NOT NULL,
    track_id INT NOT NULL,
    liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, track_id),
    CONSTRAINT fk_lt_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lt_track FOREIGN KEY (track_id) 
        REFERENCES tracks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_lt_user_date (user_id, liked_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 11. SAVED_ARTISTS: Followed / saved artist library collection (Student 2)
-- --------------------------------------------------------------------
CREATE TABLE saved_artists (
    user_id INT NOT NULL,
    artist_id INT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, artist_id),
    CONSTRAINT fk_sa_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sa_artist FOREIGN KEY (artist_id) 
        REFERENCES artists(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_sa_user_date (user_id, saved_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 12. RECENT_TRACKS: Real user playback / detail exploration history (Student 2)
--     Recorded strictly when playback starts or details are inspected.
-- --------------------------------------------------------------------
CREATE TABLE recent_tracks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    track_id INT NOT NULL,
    listened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rt_track FOREIGN KEY (track_id) 
        REFERENCES tracks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_rt_user_history (user_id, listened_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

