<?php
/**
 * ECHO — Library API Endpoint (Student 2 Module: My Library)
 * Liked songs collection, followed artists, and playback history tracking.
 */

require_once __DIR__ . '/../../app/config/database.php';
require_once __DIR__ . '/../../app/includes/auth_helper.php';

startSecureSession();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'liked';

function normalizeLibraryAudio(?string $url): string {
    if (empty($url) || strpos($url, 'freesound.org') !== false) {
        return 'assets/audio/preview-synthwave.wav';
    }
    return $url;
}

try {
    $db = Database::getConnection();

    // ----------------------------------------------------------------
    // 1. GET ?action=liked — Fetch user's liked tracks
    // ----------------------------------------------------------------
    if ($method === 'GET' && $action === 'liked') {
        $user = requireAuth();

        $stmt = $db->prepare("
            SELECT 
                t.id, t.title, t.duration_seconds, t.preview_url, t.plays_count,
                a.title AS album_title, a.cover_url,
                ar.name AS artist_name,
                lt.liked_at
            FROM liked_tracks lt
            JOIN tracks t ON lt.track_id = t.id
            JOIN albums a ON t.album_id = a.id
            JOIN artists ar ON a.artist_id = ar.id
            WHERE lt.user_id = :user_id
            ORDER BY lt.liked_at DESC
        ");
        $stmt->execute([':user_id' => $user['id']]);
        $tracks = $stmt->fetchAll();
        foreach ($tracks as &$lt) {
            $lt['preview_url'] = normalizeLibraryAudio($lt['preview_url']);
        }

        jsonResponse([
            'success' => true,
            'count'   => count($tracks),
            'tracks'  => $tracks
        ]);
    }

    // ----------------------------------------------------------------
    // 2. POST ?action=toggle_like — Like / Unlike track toggle
    // ----------------------------------------------------------------
    if ($method === 'POST' && $action === 'toggle_like') {
        $user = requireAuth();
        requireCsrf();

        $input = getJsonInput();
        $trackId = (int)($input['track_id'] ?? 0);

        if ($trackId <= 0) {
            jsonError('Invalid track ID specified.', 422);
        }

        // Verify track exists
        $checkTrack = $db->prepare("SELECT id, title FROM tracks WHERE id = :id");
        $checkTrack->execute([':id' => $trackId]);
        $track = $checkTrack->fetch();
        if (!$track) {
            jsonError('Track not found in catalogue.', 404);
        }

        // Check if already liked
        $checkLike = $db->prepare("SELECT 1 FROM liked_tracks WHERE user_id = :u AND track_id = :t");
        $checkLike->execute([':u' => $user['id'], ':t' => $trackId]);
        $isLiked = (bool)$checkLike->fetch();

        if ($isLiked) {
            // Unlike
            $delStmt = $db->prepare("DELETE FROM liked_tracks WHERE user_id = :u AND track_id = :t");
            $delStmt->execute([':u' => $user['id'], ':t' => $trackId]);

            jsonResponse([
                'success'  => true,
                'is_liked' => false,
                'message'  => "Removed \"{$track['title']}\" from Liked Songs."
            ]);
        } else {
            // Like
            $insStmt = $db->prepare("INSERT INTO liked_tracks (user_id, track_id) VALUES (:u, :t)");
            $insStmt->execute([':u' => $user['id'], ':t' => $trackId]);

            jsonResponse([
                'success'  => true,
                'is_liked' => true,
                'message'  => "Saved \"{$track['title']}\" to Liked Songs."
            ]);
        }
    }

    // ----------------------------------------------------------------
    // 3. GET ?action=artists — Fetch user's saved / followed artists
    // ----------------------------------------------------------------
    if ($method === 'GET' && $action === 'artists') {
        $user = requireAuth();

        $stmt = $db->prepare("
            SELECT 
                ar.id, ar.name, ar.bio, ar.image_url, ar.monthly_listeners,
                sa.saved_at
            FROM saved_artists sa
            JOIN artists ar ON sa.artist_id = ar.id
            WHERE sa.user_id = :user_id
            ORDER BY sa.saved_at DESC
        ");
        $stmt->execute([':user_id' => $user['id']]);
        $artists = $stmt->fetchAll();

        jsonResponse([
            'success' => true,
            'count'   => count($artists),
            'artists' => $artists
        ]);
    }

    // ----------------------------------------------------------------
    // 4. POST ?action=toggle_artist — Save / Unsave artist toggle
    // ----------------------------------------------------------------
    if ($method === 'POST' && $action === 'toggle_artist') {
        $user = requireAuth();
        requireCsrf();

        $input = getJsonInput();
        $artistId = (int)($input['artist_id'] ?? 0);

        if ($artistId <= 0) {
            jsonError('Invalid artist ID specified.', 422);
        }

        $checkArtist = $db->prepare("SELECT id, name FROM artists WHERE id = :id");
        $checkArtist->execute([':id' => $artistId]);
        $artist = $checkArtist->fetch();
        if (!$artist) {
            jsonError('Artist not found in catalogue.', 404);
        }

        $checkSaved = $db->prepare("SELECT 1 FROM saved_artists WHERE user_id = :u AND artist_id = :a");
        $checkSaved->execute([':u' => $user['id'], ':a' => $artistId]);
        $isSaved = (bool)$checkSaved->fetch();

        if ($isSaved) {
            $delStmt = $db->prepare("DELETE FROM saved_artists WHERE user_id = :u AND artist_id = :a");
            $delStmt->execute([':u' => $user['id'], ':a' => $artistId]);

            jsonResponse([
                'success'  => true,
                'is_saved' => false,
                'message'  => "Unfollowed {$artist['name']}."
            ]);
        } else {
            $insStmt = $db->prepare("INSERT INTO saved_artists (user_id, artist_id) VALUES (:u, :a)");
            $insStmt->execute([':u' => $user['id'], ':a' => $artistId]);

            jsonResponse([
                'success'  => true,
                'is_saved' => true,
                'message'  => "Added {$artist['name']} to Saved Artists."
            ]);
        }
    }

    // ----------------------------------------------------------------
    // 5. GET ?action=recent — Fetch user's listening & exploration history
    // ----------------------------------------------------------------
    if ($method === 'GET' && $action === 'recent') {
        $user = requireAuth();

        $stmt = $db->prepare("
            SELECT 
                rt.id AS history_id, rt.listened_at,
                t.id, t.title, t.duration_seconds, t.preview_url,
                a.title AS album_title, a.cover_url,
                ar.name AS artist_name
            FROM recent_tracks rt
            JOIN tracks t ON rt.track_id = t.id
            JOIN albums a ON t.album_id = a.id
            JOIN artists ar ON a.artist_id = ar.id
            WHERE rt.user_id = :user_id
            ORDER BY rt.listened_at DESC
            LIMIT 25
        ");
        $stmt->execute([':user_id' => $user['id']]);
        $recent = $stmt->fetchAll();
        foreach ($recent as &$rt) {
            $rt['preview_url'] = normalizeLibraryAudio($rt['preview_url']);
        }

        jsonResponse([
            'success' => true,
            'count'   => count($recent),
            'tracks'  => $recent
        ]);
    }

    // ----------------------------------------------------------------
    // 6. POST ?action=record_recent — Record playback / detail exploration
    // ----------------------------------------------------------------
    if ($method === 'POST' && $action === 'record_recent') {
        $user = getAuthUser();
        // Silent return if guest user
        if (!$user) {
            jsonResponse(['success' => true, 'recorded' => false]);
        }

        $input = getJsonInput();
        $trackId = (int)($input['track_id'] ?? 0);

        if ($trackId > 0) {
            // Increment track plays_count
            $incStmt = $db->prepare("UPDATE tracks SET plays_count = plays_count + 1 WHERE id = :id");
            $incStmt->execute([':id' => $trackId]);

            // Insert into recent history
            $recStmt = $db->prepare("
                INSERT INTO recent_tracks (user_id, track_id, listened_at) 
                VALUES (:u, :t, CURRENT_TIMESTAMP)
            ");
            $recStmt->execute([':u' => $user['id'], ':t' => $trackId]);

            jsonResponse(['success' => true, 'recorded' => true]);
        }

        jsonError('Invalid track ID.', 422);
    }

    jsonError('Unknown library action.', 400);

} catch (Exception $e) {
    error_log("Library API error: " . $e->getMessage());
    jsonError("An unexpected server error occurred while processing library request.", 500);
}

