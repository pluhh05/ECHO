<?php
/**
 * ECHO — Catalogue API Endpoint (Student 1 Module: Discover & Explore Genres)
 * High-performance, parameterized PDO queries for discovery, genre filtering,
 * multi-entity search, and track/artist detail lookups.
 */

require_once __DIR__ . '/../../app/config/database.php';
require_once __DIR__ . '/../../app/includes/auth_helper.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'discover';

if ($method !== 'GET') {
    jsonError('Only GET requests are supported on the catalogue endpoint.', 405);
}

function normalizePreviewUrl(?string $url, ?string $genre = ''): string {
    if (empty($url) || strpos($url, 'freesound.org') !== false) {
        $g = strtolower($genre ?: '');
        if (strpos($g, 'lo-fi') !== false || strpos($g, 'chill') !== false) {
            return 'assets/audio/preview-lofi.wav';
        }
        if (strpos($g, 'ambient') !== false || strpos($g, 'jazz') !== false || strpos($g, 'classical') !== false) {
            return 'assets/audio/preview-ambient.wav';
        }
        return 'assets/audio/preview-synthwave.wav';
    }
    return $url;
}

try {
    $db = Database::getConnection();

    // ----------------------------------------------------------------
    // 1. GET ?action=discover — Editorial Hero, ECHO Picks, Featured Artists, New Releases
    // ----------------------------------------------------------------
    if ($action === 'discover') {
        // Hero release: Latest featured album with staff pick track
        $heroStmt = $db->query("
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
        $hero = $heroStmt->fetch();

        if ($hero) {
            $hero['preview_url'] = normalizePreviewUrl($hero['preview_url'], $hero['genre_name'] ?? '');
            $hero['description'] = "An ethereal journey through analog synthesizers, punchy 80s drums, and haunting vocal textures. The definitive late-night soundscape.";
        }

        // ECHO Picks: Verified genuine ranking combining curator staff picks and play count
        $picksStmt = $db->query("
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
            LIMIT 8
        ");
        $picks = $picksStmt->fetchAll();
        foreach ($picks as &$p) {
            $p['preview_url'] = normalizePreviewUrl($p['preview_url'], $p['genre_name'] ?? '');
        }

        // Featured Artists
        $artistsStmt = $db->query("
            SELECT id, name, bio, image_url, monthly_listeners
            FROM artists
            ORDER BY monthly_listeners DESC
            LIMIT 6
        ");
        $artists = $artistsStmt->fetchAll();

        // Fresh Releases (ordered strictly by release_date)
        $releasesStmt = $db->query("
            SELECT 
                a.id, a.title, a.release_date, a.cover_url, a.album_type,
                ar.id AS artist_id, ar.name AS artist_name,
                COUNT(t.id) AS track_count
            FROM albums a
            JOIN artists ar ON a.artist_id = ar.id
            LEFT JOIN tracks t ON a.id = t.album_id
            GROUP BY a.id
            ORDER BY a.release_date DESC
            LIMIT 4
        ");
        $releases = $releasesStmt->fetchAll();

        jsonResponse([
            'success'      => true,
            'hero'         => $hero,
            'picks'        => $picks,
            'artists'      => $artists,
            'new_releases' => $releases
        ]);
    }

    // ----------------------------------------------------------------
    // 2. GET ?action=genres — List all genres with track count
    // ----------------------------------------------------------------
    if ($action === 'genres') {
        $stmt = $db->query("
            SELECT 
                g.id, g.name, g.slug, g.color_accent, g.description,
                COUNT(tg.track_id) AS track_count
            FROM genres g
            LEFT JOIN track_genres tg ON g.id = tg.genre_id
            GROUP BY g.id
            ORDER BY g.name ASC
        ");
        $genres = $stmt->fetchAll();

        jsonResponse([
            'success' => true,
            'genres'  => $genres
        ]);
    }

    // ----------------------------------------------------------------
    // 3. GET ?action=tracks — Filter catalogue tracks by genre, search query, & sort
    // ----------------------------------------------------------------
    if ($action === 'tracks') {
        $genreSlug = trim($_GET['genre'] ?? 'all');
        $search    = trim($_GET['q'] ?? '');
        $sort      = trim($_GET['sort'] ?? 'popular'); // 'popular', 'title', 'newest'

        $sql = "
            SELECT 
                t.id, t.title, t.duration_seconds, t.preview_url, t.plays_count, t.release_date,
                a.id AS album_id, a.title AS album_title, a.cover_url,
                ar.id AS artist_id, ar.name AS artist_name,
                GROUP_CONCAT(DISTINCT g.name SEPARATOR ', ') AS genres
            FROM tracks t
            JOIN albums a ON t.album_id = a.id
            JOIN artists ar ON a.artist_id = ar.id
            LEFT JOIN track_genres tg ON t.id = tg.track_id
            LEFT JOIN genres g ON tg.genre_id = g.id
            WHERE 1=1
        ";

        $params = [];

        // Genre filtering
        if (!empty($genreSlug) && strtolower($genreSlug) !== 'all') {
            $sql .= " AND t.id IN (
                SELECT tg2.track_id 
                FROM track_genres tg2 
                JOIN genres g2 ON tg2.genre_id = g2.id 
                WHERE g2.slug = :genre_slug
            )";
            $params[':genre_slug'] = $genreSlug;
        }

        // Search query filtering
        if (!empty($search)) {
            $sql .= " AND (
                t.title LIKE :search_track 
                OR ar.name LIKE :search_artist 
                OR a.title LIKE :search_album
            )";
            $searchWildcard = "%{$search}%";
            $params[':search_track']  = $searchWildcard;
            $params[':search_artist'] = $searchWildcard;
            $params[':search_album']  = $searchWildcard;
        }

        $sql .= " GROUP BY t.id ";

        // Sorting
        if ($sort === 'title') {
            $sql .= " ORDER BY t.title ASC ";
        } elseif ($sort === 'newest') {
            $sql .= " ORDER BY t.release_date DESC, t.id DESC ";
        } else {
            // Default: most popular
            $sql .= " ORDER BY t.plays_count DESC, t.id ASC ";
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $tracks = $stmt->fetchAll();
        foreach ($tracks as &$t) {
            $t['preview_url'] = normalizePreviewUrl($t['preview_url'], $t['genres'] ?? '');
        }

        jsonResponse([
            'success' => true,
            'count'   => count($tracks),
            'tracks'  => $tracks
        ]);
    }

    // ----------------------------------------------------------------
    // 4. GET ?action=search — Multi-entity search across tracks, artists, albums
    // ----------------------------------------------------------------
    if ($action === 'search') {
        $query = trim($_GET['q'] ?? '');

        if (empty($query)) {
            jsonResponse([
                'success' => true,
                'tracks'  => [],
                'artists' => [],
                'albums'  => []
            ]);
        }

        $param = "%{$query}%";

        // 1. Search tracks
        $tStmt = $db->prepare("
            SELECT 
                t.id, t.title, t.duration_seconds, t.preview_url, t.plays_count,
                a.title AS album_title, a.cover_url,
                ar.name AS artist_name
            FROM tracks t
            JOIN albums a ON t.album_id = a.id
            JOIN artists ar ON a.artist_id = ar.id
            WHERE t.title LIKE :q
            ORDER BY t.plays_count DESC
            LIMIT 10
        ");
        $tStmt->execute([':q' => $param]);
        $tracks = $tStmt->fetchAll();

        // 2. Search artists
        $arStmt = $db->prepare("
            SELECT id, name, bio, image_url, monthly_listeners
            FROM artists
            WHERE name LIKE :q
            ORDER BY monthly_listeners DESC
            LIMIT 6
        ");
        $arStmt->execute([':q' => $param]);
        $artists = $arStmt->fetchAll();

        // 3. Search albums
        $alStmt = $db->prepare("
            SELECT 
                a.id, a.title, a.release_date, a.cover_url, a.album_type,
                ar.name AS artist_name
            FROM albums a
            JOIN artists ar ON a.artist_id = ar.id
            WHERE a.title LIKE :q
            ORDER BY a.release_date DESC
            LIMIT 6
        ");
        $alStmt->execute([':q' => $param]);
        $albums = $alStmt->fetchAll();

        jsonResponse([
            'success' => true,
            'query'   => $query,
            'tracks'  => $tracks,
            'artists' => $artists,
            'albums'  => $albums
        ]);
    }

    // ----------------------------------------------------------------
    // 5. GET ?action=track_detail — Full credits, collaboration artists & genres
    // ----------------------------------------------------------------
    if ($action === 'track_detail') {
        $trackId = (int)($_GET['id'] ?? 0);
        if ($trackId <= 0) {
            jsonError('Invalid track ID specified.', 400);
        }

        $stmt = $db->prepare("
            SELECT 
                t.id, t.title, t.duration_seconds, t.preview_url, t.plays_count, t.release_date,
                a.id AS album_id, a.title AS album_title, a.cover_url, a.release_date AS album_release_date,
                ar.id AS primary_artist_id, ar.name AS primary_artist_name, ar.bio AS artist_bio
            FROM tracks t
            JOIN albums a ON t.album_id = a.id
            JOIN artists ar ON a.artist_id = ar.id
            WHERE t.id = :id
            LIMIT 1
        ");
        $stmt->execute([':id' => $trackId]);
        $track = $stmt->fetch();

        if (!$track) {
            jsonError('Track not found.', 404);
        }
        $track['preview_url'] = normalizePreviewUrl($track['preview_url']);

        // Fetch collaboration artists (primary & featured)
        $collabStmt = $db->prepare("
            SELECT ar.id, ar.name, ar.image_url, ta.role
            FROM track_artists ta
            JOIN artists ar ON ta.artist_id = ar.id
            WHERE ta.track_id = :id
            ORDER BY ta.role ASC, ar.name ASC
        ");
        $collabStmt->execute([':id' => $trackId]);
        $track['artists'] = $collabStmt->fetchAll();

        // Fetch genres
        $genreStmt = $db->prepare("
            SELECT g.id, g.name, g.slug, g.color_accent
            FROM track_genres tg
            JOIN genres g ON tg.genre_id = g.id
            WHERE tg.track_id = :id
        ");
        $genreStmt->execute([':id' => $trackId]);
        $track['genres'] = $genreStmt->fetchAll();

        jsonResponse([
            'success' => true,
            'track'   => $track
        ]);
    }

    jsonError('Unknown catalogue action.', 400);

} catch (Exception $e) {
    error_log("Catalogue API error: " . $e->getMessage());
    jsonError("Failed to fetch catalogue data.", 500);
}

