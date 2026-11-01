-- ====================================================================
-- ECHO — Realistic Demo Seed Data
-- BTech 5th Semester Web Technology Project (MIT Manipal / ICT3131)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Demo Users (Default password for all demo users is: Password@123)
--    Generated via PHP password_hash('Password@123', PASSWORD_DEFAULT)
-- --------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, created_at) VALUES
(1, 'aryan_mit', 'aryan@learner.manipal.edu', '$2y$10$FkXkFzK2u8wY8b47sEw7..d9u1bZlI9vR.5uLzG2v2uD3Gk0nU60K', '2026-03-01 10:00:00'),
(2, 'sneha_mit', 'sneha@learner.manipal.edu', '$2y$10$FkXkFzK2u8wY8b47sEw7..d9u1bZlI9vR.5uLzG2v2uD3Gk0nU60K', '2026-03-05 14:30:00'),
(3, 'demo_listener', 'listener@echo.audio', '$2y$10$FkXkFzK2u8wY8b47sEw7..d9u1bZlI9vR.5uLzG2v2uD3Gk0nU60K', '2026-03-10 09:15:00');

-- --------------------------------------------------------------------
-- 2. Genres
-- --------------------------------------------------------------------
INSERT INTO genres (id, name, slug, color_accent, description) VALUES
(1, 'Synthwave', 'synthwave', '#B49AFF', 'Retro-futuristic analog synthesizers, neon drum machines, and 80s cinematic nostagia.'),
(2, 'Lo-Fi Chill', 'lo-fi', '#9BB4FF', 'Warm cassette tape saturation, mellow jazzy chords, and down-tempo relaxing study beats.'),
(3, 'Electronic', 'electronic', '#60A5FA', 'Driving club rhythms, intricate melodic sequences, and hypnotic progressive basslines.'),
(4, 'Indie Rock', 'indie-rock', '#F472B6', 'Raw jangly guitars, emotive poetic lyricism, and authentic DIY garage textures.'),
(5, 'Jazz & Soul', 'jazz', '#FBBF24', 'Expressive brass solos, rich upright acoustic bass, and midnight lounge harmonies.'),
(6, 'Classical & Ambient', 'classical', '#34D399', 'Minimalist grand piano sonatas, resonant string quartets, and atmospheric drones.');

-- --------------------------------------------------------------------
-- 3. Artists
-- --------------------------------------------------------------------
INSERT INTO artists (id, name, bio, image_url, is_verified, monthly_listeners, created_at) VALUES
(1, 'Astral Wave', 'Pioneering synthwave duo blending vintage Yamaha CS-80 textures with modern bass design.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', 1, 142500, '2026-01-10 12:00:00'),
(2, 'Komorebi Sound', 'Tokyo-born lo-fi producer crafting comforting vinyl beats for study and quiet contemplation.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', 1, 98300, '2026-01-12 12:00:00'),
(3, 'Hyperion Drive', 'Modular synth explorer creating high-octane electronic voyages through dark cybernetic alleys.', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80', 1, 76200, '2026-01-15 12:00:00'),
(4, 'Elena Rostova', 'Contemporary neo-classical pianist known for delicate, evocative compositions and tape loops.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', 1, 65400, '2026-01-18 12:00:00'),
(5, 'Miles & Blue Notes', 'Late-night Harlem jazz quartet reviving hard-bop elegance with smoky saxophone improvisations.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', 1, 112000, '2026-01-20 12:00:00'),
(6, 'Pacific Pines', 'Pacific Northwest four-piece capturing coastal rain and nostalgic guitar reverbs.', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80', 1, 84300, '2026-01-22 12:00:00');

-- --------------------------------------------------------------------
-- 4. Albums
-- --------------------------------------------------------------------
INSERT INTO albums (id, title, artist_id, release_date, cover_url, album_type, created_at) VALUES
(1, 'Midnight Reflections', 1, '2026-04-12', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', 'album', '2026-04-12 00:00:00'),
(2, 'Chasing Twilight', 2, '2026-03-20', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80', 'album', '2026-03-20 00:00:00'),
(3, 'Quantum Drift', 3, '2026-02-14', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80', 'album', '2026-02-14 00:00:00'),
(4, 'Solitude in Paris', 4, '2026-01-08', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80', 'album', '2026-01-08 00:00:00'),
(5, 'Harlem Rain', 5, '2026-02-28', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80', 'album', '2026-02-28 00:00:00'),
(6, 'Northern Fog', 6, '2026-03-15', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80', 'album', '2026-03-15 00:00:00');

-- --------------------------------------------------------------------
-- 5. Tracks
--    Audio preview streams: Royalty-free CC0/CC-BY audio samples
-- --------------------------------------------------------------------
INSERT INTO tracks (id, title, album_id, duration_seconds, preview_url, plays_count, release_date, is_staff_pick, created_at) VALUES
(1, 'Neon Odyssey', 1, 194, 'assets/audio/preview-synthwave.wav', 8940, '2026-04-12', 1, '2026-04-12 00:00:00'),
(2, 'Cyber City Rain', 1, 202, 'assets/audio/preview-synthwave.wav', 7520, '2026-04-12', 0, '2026-04-12 00:00:00'),
(3, 'Retro Arcade Memories', 1, 185, 'assets/audio/preview-synthwave.wav', 6310, '2026-04-12', 0, '2026-04-12 00:00:00'),
(4, 'Velvet Horizon', 2, 148, 'assets/audio/preview-lofi.wav', 9450, '2026-03-20', 1, '2026-03-20 00:00:00'),
(5, 'Morning Dew Drops', 2, 132, 'assets/audio/preview-lofi.wav', 4890, '2026-03-20', 0, '2026-03-20 00:00:00'),
(6, 'Warm Matcha Tea', 2, 160, 'assets/audio/preview-lofi.wav', 5120, '2026-03-20', 0, '2026-03-20 00:00:00'),
(7, 'Solar Flare', 3, 215, 'assets/audio/preview-synthwave.wav', 7840, '2026-02-14', 1, '2026-02-14 00:00:00'),
(8, 'Dark Matter Protocol', 3, 230, 'assets/audio/preview-synthwave.wav', 6120, '2026-02-14', 0, '2026-02-14 00:00:00'),
(9, 'Subtle Whispers', 4, 184, 'assets/audio/preview-ambient.wav', 5940, '2026-01-08', 1, '2026-01-08 00:00:00'),
(10, 'Waltz in Autumn', 4, 198, 'assets/audio/preview-ambient.wav', 4210, '2026-01-08', 0, '2026-01-08 00:00:00'),
(11, 'After Midnight Sax', 5, 232, 'assets/audio/preview-ambient.wav', 8920, '2026-02-28', 1, '2026-02-28 00:00:00'),
(12, 'Blue Note Rooftop', 5, 210, 'assets/audio/preview-ambient.wav', 6740, '2026-02-28', 0, '2026-02-28 00:00:00'),
(13, 'Echoes of the Coast', 6, 176, 'assets/audio/preview-lofi.wav', 6350, '2026-03-15', 1, '2026-03-15 00:00:00'),
(14, 'Cedar and Ocean Fog', 6, 188, 'assets/audio/preview-lofi.wav', 4180, '2026-03-15', 0, '2026-03-15 00:00:00');

-- --------------------------------------------------------------------
-- 6. Track Artists (Including Collaborations)
-- --------------------------------------------------------------------
INSERT INTO track_artists (track_id, artist_id, role) VALUES
(1, 1, 'primary'),
(1, 2, 'featured'), -- Astral Wave ft. Komorebi Sound
(2, 1, 'primary'),
(3, 1, 'primary'),
(4, 2, 'primary'),
(5, 2, 'primary'),
(6, 2, 'primary'),
(7, 3, 'primary'),
(8, 3, 'primary'),
(9, 4, 'primary'),
(10, 4, 'primary'),
(11, 5, 'primary'),
(12, 5, 'primary'),
(13, 6, 'primary'),
(14, 6, 'primary');

-- --------------------------------------------------------------------
-- 7. Track Genres (Multiple Genres per Track supported)
-- --------------------------------------------------------------------
INSERT INTO track_genres (track_id, genre_id) VALUES
(1, 1), (1, 3), -- Neon Odyssey: Synthwave + Electronic
(2, 1),
(3, 1),
(4, 2), (4, 5), -- Velvet Horizon: Lo-Fi + Jazz
(5, 2),
(6, 2),
(7, 3),
(8, 3),
(9, 6), (9, 2), -- Subtle Whispers: Classical + Lo-Fi
(10, 6),
(11, 5),
(12, 5),
(13, 4),
(14, 4);

-- --------------------------------------------------------------------
-- 8. Playlists (Student 2)
-- --------------------------------------------------------------------
INSERT INTO playlists (id, user_id, title, description, cover_url, is_public, created_at) VALUES
(1, 1, 'Midnight Coding Flow', 'Lush synthwave textures and ambient beats for deep focus.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80', 1, '2026-04-10 18:00:00'),
(2, 1, 'Late Night Coffee & Jazz', 'Mellow saxophones and upright bass for quiet evenings.', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80', 1, '2026-04-15 21:30:00'),
(3, 2, 'Morning Study Cafe', 'Soothing lo-fi tracks and warm acoustic keys.', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80', 1, '2026-04-18 08:20:00');

-- --------------------------------------------------------------------
-- 9. Playlist Tracks
-- --------------------------------------------------------------------
INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at) VALUES
(1, 1, 1, '2026-04-10 18:05:00'),
(1, 4, 2, '2026-04-10 18:06:00'),
(1, 7, 3, '2026-04-10 18:07:00'),
(2, 11, 1, '2026-04-15 21:32:00'),
(2, 12, 2, '2026-04-15 21:35:00'),
(3, 4, 1, '2026-04-18 08:22:00'),
(3, 5, 2, '2026-04-18 08:23:00');

-- --------------------------------------------------------------------
-- 10. Liked Tracks (Student 2)
-- --------------------------------------------------------------------
INSERT INTO liked_tracks (user_id, track_id, liked_at) VALUES
(1, 1, '2026-04-11 14:20:00'),
(1, 4, '2026-04-12 19:10:00'),
(1, 7, '2026-04-13 11:45:00'),
(2, 4, '2026-04-18 09:00:00'),
(2, 9, '2026-04-19 16:30:00');

-- --------------------------------------------------------------------
-- 11. Saved Artists (Student 2)
-- --------------------------------------------------------------------
INSERT INTO saved_artists (user_id, artist_id, saved_at) VALUES
(1, 1, '2026-04-11 14:22:00'),
(1, 2, '2026-04-12 19:12:00'),
(2, 2, '2026-04-18 09:02:00'),
(2, 4, '2026-04-19 16:35:00');

-- --------------------------------------------------------------------
-- 12. Recent Tracks (Student 2)
-- --------------------------------------------------------------------
INSERT INTO recent_tracks (user_id, track_id, listened_at) VALUES
(1, 7, '2026-04-25 21:40:00'),
(1, 1, '2026-04-25 21:45:00'),
(1, 4, '2026-04-25 21:50:00'),
(2, 9, '2026-04-25 15:10:00');

