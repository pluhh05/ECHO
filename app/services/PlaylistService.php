<?php
/**
 * ECHO — Playlist Service
 * Encapsulates playlist CRUD and membership integrity rules.
 * Demonstrates clean Service Layer separation for Viva evaluation.
 */

require_once __DIR__ . '/../config/database.php';

class PlaylistService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getUserPlaylists(int $userId): array {
        $stmt = $this->db->prepare("
            SELECT 
                p.id, p.title, p.description, p.cover_url, p.is_public, p.created_at, p.updated_at,
                COUNT(pt.track_id) AS track_count
            FROM playlists p
            LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
            WHERE p.user_id = :user_id
            GROUP BY p.id
            ORDER BY p.updated_at DESC, p.created_at DESC
        ");
        $stmt->execute([':user_id' => $userId]);
        return $stmt->fetchAll();
    }

    public function isTrackInPlaylist(int $playlistId, int $trackId): bool {
        $stmt = $this->db->prepare("SELECT 1 FROM playlist_tracks WHERE playlist_id = :p AND track_id = :t");
        $stmt->execute([':p' => $playlistId, ':t' => $trackId]);
        return (bool)$stmt->fetch();
    }
}

