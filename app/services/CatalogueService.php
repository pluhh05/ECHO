<?php
/**
 * ECHO — Catalogue Service
 * Encapsulates catalogue business logic and query operations.
 * Demonstrates clean Service Layer separation for Viva evaluation.
 */

require_once __DIR__ . '/../config/database.php';

class CatalogueService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getFeaturedHero(): ?array {
        $stmt = $this->db->query("
            SELECT 
                t.id, t.title, t.duration_seconds, t.preview_url, t.release_date,
                a.id AS album_id, a.title AS album_title, a.cover_url,
                ar.id AS artist_id, ar.name AS artist_name,
                g.name AS genre_name, g.slug AS genre_slug
            FROM tracks t
            JOIN albums a ON t.album_id = a.id
            JOIN artists ar ON a.artist_id = ar.id
            LEFT JOIN track_genres tg ON t.id = tg.track_id
            LEFT JOIN genres g ON tg.genre_id = g.id
            WHERE t.is_staff_pick = 1
            ORDER BY t.release_date DESC, t.plays_count DESC
            LIMIT 1
        ");
        $hero = $stmt->fetch();
        if ($hero) {
            $hero['description'] = "An ethereal journey through analog synthesizers, punchy 80s drums, and haunting vocal textures. The definitive late-night soundscape.";
        }
        return $hero ?: null;
    }

    public function getEchoPicks(int $limit = 8): array {
        $stmt = $this->db->prepare("
            SELECT 
                t.id, t.title, t.duration_seconds, t.preview_url, t.plays_count, t.release_date,
                a.id AS album_id, a.title AS album_title, a.cover_url,
                ar.id AS artist_id, ar.name AS artist_name,
                g.name AS genre_name
            FROM tracks t
            JOIN albums a ON t.album_id = a.id
            JOIN artists ar ON a.artist_id = ar.id
            LEFT JOIN track_genres tg ON t.id = tg.track_id
            LEFT JOIN genres g ON tg.genre_id = g.id
            WHERE t.is_staff_pick = 1 OR t.plays_count > 6000
            GROUP BY t.id
            ORDER BY t.is_staff_pick DESC, t.plays_count DESC
            LIMIT :limit
        ");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}

