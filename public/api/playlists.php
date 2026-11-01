<?php
/**
 * ECHO — Playlists API Endpoint (Student 2 Module: My Playlists)
 * Complete CRUD for user-owned playlists, track membership management,
 * position ordering, and duplicate track prevention.
 */

require_once __DIR__ . '/../../app/config/database.php';
require_once __DIR__ . '/../../app/includes/auth_helper.php';

startSecureSession();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

function normalizePlaylistAudio(?string $url): string {
    if (empty($url) || strpos($url, 'freesound.org') !== false) {
        return 'assets/audio/preview-synthwave.wav';
    }
    return $url;
}

try {
    $db = Database::getConnection();

    // ----------------------------------------------------------------
    // 1. GET ?action=list — Fetch all playlists belonging to logged-in user
    // ----------------------------------------------------------------
    if ($method === 'GET' && $action === 'list') {
        $user = requireAuth();

        $stmt = $db->prepare("
            SELECT 
                p.id, p.title, p.description, p.cover_url, p.is_public, p.created_at, p.updated_at,
                COUNT(pt.track_id) AS track_count
            FROM playlists p
            LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
            WHERE p.user_id = :user_id
            GROUP BY p.id
            ORDER BY p.updated_at DESC, p.created_at DESC
        ");
        $stmt->execute([':user_id' => $user['id']]);
        $playlists = $stmt->fetchAll();

        jsonResponse([
            'success'   => true,
            'playlists' => $playlists
        ]);
    }

    // ----------------------------------------------------------------
    // 2. GET ?action=get&id={id} — Fetch single playlist details with ordered tracks
    // ----------------------------------------------------------------
    if ($method === 'GET' && $action === 'get') {
        $playlistId = (int)($_GET['id'] ?? 0);
        if ($playlistId <= 0) {
            jsonError('Invalid playlist ID specified.', 400);
        }

        // Fetch playlist header
        $pStmt = $db->prepare("
            SELECT p.*, u.username AS owner_name 
            FROM playlists p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = :id
            LIMIT 1
        ");
        $pStmt->execute([':id' => $playlistId]);
        $playlist = $pStmt->fetch();

        if (!$playlist) {
            jsonError('Playlist not found.', 404);
        }

        // Check visibility if private
        $user = getAuthUser();
        if (!$playlist['is_public'] && (!$user || $user['id'] !== (int)$playlist['user_id'])) {
            jsonError('This playlist is private.', 403);
        }

        // Fetch ordered tracks
        $tStmt = $db->prepare("
            SELECT 
                t.id, t.title, t.duration_seconds, t.preview_url, t.plays_count,
                a.title AS album_title, a.cover_url,
                ar.name AS artist_name,
                pt.position, pt.added_at
            FROM playlist_tracks pt
            JOIN tracks t ON pt.track_id = t.id
            JOIN albums a ON t.album_id = a.id
            JOIN artists ar ON a.artist_id = ar.id
            WHERE pt.playlist_id = :playlist_id
            ORDER BY pt.position ASC, pt.added_at ASC
        ");
        $tStmt->execute([':playlist_id' => $playlistId]);
        $playlist['tracks'] = $tStmt->fetchAll();
        foreach ($playlist['tracks'] as &$pt) {
            $pt['preview_url'] = normalizePlaylistAudio($pt['preview_url']);
        }

        // Calculate total duration
        $totalDuration = array_sum(array_column($playlist['tracks'], 'duration_seconds'));
        $playlist['total_duration_seconds'] = $totalDuration;
        $playlist['is_owner'] = $user && ($user['id'] === (int)$playlist['user_id']);

        jsonResponse([
            'success'  => true,
            'playlist' => $playlist
        ]);
    }

    // ----------------------------------------------------------------
    // 3. POST ?action=create — Create a new playlist
    // ----------------------------------------------------------------
    if ($method === 'POST' && $action === 'create') {
        $user = requireAuth();
        requireCsrf();

        $input = getJsonInput();
        $title = trim($input['title'] ?? '');
        $description = trim($input['description'] ?? '');

        if (empty($title)) {
            jsonError('Playlist title is required.', 422);
        }
        if (strlen($title) > 100) {
            jsonError('Playlist title must not exceed 100 characters.', 422);
        }

        $stmt = $db->prepare("
            INSERT INTO playlists (user_id, title, description, cover_url, is_public)
            VALUES (:user_id, :title, :description, 'assets/images/default-cover.svg', 1)
        ");
        $stmt->execute([
            ':user_id'     => $user['id'],
            ':title'       => $title,
            ':description' => $description
        ]);

        $newId = (int)$db->lastInsertId();

        jsonResponse([
            'success'     => true,
            'message'     => 'Playlist created successfully.',
            'playlist_id' => $newId
        ], 201);
    }

    // ----------------------------------------------------------------
    // 4. POST ?action=update — Rename / edit description of existing playlist
    // ----------------------------------------------------------------
    if ($method === 'POST' && $action === 'update') {
        $user = requireAuth();
        requireCsrf();

        $input = getJsonInput();
        $playlistId = (int)($input['id'] ?? $_GET['id'] ?? 0);
        $title = trim($input['title'] ?? '');
        $description = trim($input['description'] ?? '');

        if ($playlistId <= 0 || empty($title)) {
            jsonError('Valid playlist ID and title are required.', 422);
        }

        // Verify ownership
        $checkStmt = $db->prepare("SELECT user_id FROM playlists WHERE id = :id");
        $checkStmt->execute([':id' => $playlistId]);
        $ownerId = $checkStmt->fetchColumn();

        if ($ownerId === false) {
            jsonError('Playlist not found.', 404);
        }
        if ((int)$ownerId !== $user['id']) {
            jsonError('You do not have permission to modify this playlist.', 403);
        }

        $stmt = $db->prepare("
            UPDATE playlists 
            SET title = :title, description = :description, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ");
        $stmt->execute([
            ':title'       => $title,
            ':description' => $description,
            ':id'          => $playlistId
        ]);

        jsonResponse([
            'success' => true,
            'message' => 'Playlist updated successfully.'
        ]);
    }

    // ----------------------------------------------------------------
    // 5. POST ?action=delete — Delete playlist (never deletes catalogue tracks)
    // ----------------------------------------------------------------
    if ($method === 'POST' && $action === 'delete') {
        $user = requireAuth();
        requireCsrf();

        $input = getJsonInput();
        $playlistId = (int)($input['id'] ?? $_GET['id'] ?? 0);

        if ($playlistId <= 0) {
            jsonError('Valid playlist ID is required.', 422);
        }

        // Verify ownership
        $checkStmt = $db->prepare("SELECT user_id, title FROM playlists WHERE id = :id");
        $checkStmt->execute([':id' => $playlistId]);
        $row = $checkStmt->fetch();

        if (!$row) {
            jsonError('Playlist not found.', 404);
        }
        if ((int)$row['user_id'] !== $user['id']) {
            jsonError('You do not have permission to delete this playlist.', 403);
        }

        // Cascade rule deletes playlist_tracks; catalogue tracks remain untouched
        $delStmt = $db->prepare("DELETE FROM playlists WHERE id = :id");
        $delStmt->execute([':id' => $playlistId]);

        jsonResponse([
            'success' => true,
            'message' => "Playlist \"{$row['title']}\" deleted successfully."
        ]);
    }

    // ----------------------------------------------------------------
    // 6. POST ?action=add_track — Add track to playlist with duplicate prevention
    // ----------------------------------------------------------------
    if ($method === 'POST' && $action === 'add_track') {
        $user = requireAuth();
        requireCsrf();

        $input = getJsonInput();
        $playlistId = (int)($input['playlist_id'] ?? 0);
        $trackId    = (int)($input['track_id'] ?? 0);

        if ($playlistId <= 0 || $trackId <= 0) {
            jsonError('Playlist ID and Track ID are required.', 422);
        }

        // Verify playlist ownership
        $checkStmt = $db->prepare("SELECT user_id FROM playlists WHERE id = :id");
        $checkStmt->execute([':id' => $playlistId]);
        $ownerId = $checkStmt->fetchColumn();

        if ($ownerId === false) {
            jsonError('Playlist not found.', 404);
        }
        if ((int)$ownerId !== $user['id']) {
            jsonError('You do not have permission to add tracks to this playlist.', 403);
        }

        // Verify track exists in catalogue
        $trackCheck = $db->prepare("SELECT id, title FROM tracks WHERE id = :id");
        $trackCheck->execute([':id' => $trackId]);
        $track = $trackCheck->fetch();
        if (!$track) {
            jsonError('Track not found in catalogue.', 404);
        }

        // Prevent duplicate track membership
        $dupStmt = $db->prepare("SELECT 1 FROM playlist_tracks WHERE playlist_id = :p AND track_id = :t");
        $dupStmt->execute([':p' => $playlistId, ':t' => $trackId]);
        if ($dupStmt->fetch()) {
            jsonError("This track is already in the playlist.", 409);
        }

        // Determine next position
        $posStmt = $db->prepare("SELECT COALESCE(MAX(position), 0) + 1 FROM playlist_tracks WHERE playlist_id = :p");
        $posStmt->execute([':p' => $playlistId]);
        $nextPos = (int)$posStmt->fetchColumn();

        $insertStmt = $db->prepare("
            INSERT INTO playlist_tracks (playlist_id, track_id, position)
            VALUES (:p, :t, :pos)
        ");
        $insertStmt->execute([
            ':p'   => $playlistId,
            ':t'   => $trackId,
            ':pos' => $nextPos
        ]);

        // Update playlist updated_at
        $db->prepare("UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = :id")->execute([':id' => $playlistId]);

        jsonResponse([
            'success' => true,
            'message' => "Added \"{$track['title']}\" to playlist."
        ]);
    }

    // ----------------------------------------------------------------
    // 7. POST ?action=remove_track — Remove track from playlist
    // ----------------------------------------------------------------
    if ($method === 'POST' && $action === 'remove_track') {
        $user = requireAuth();
        requireCsrf();

        $input = getJsonInput();
        $playlistId = (int)($input['playlist_id'] ?? 0);
        $trackId    = (int)($input['track_id'] ?? 0);

        if ($playlistId <= 0 || $trackId <= 0) {
            jsonError('Playlist ID and Track ID are required.', 422);
        }

        // Verify playlist ownership
        $checkStmt = $db->prepare("SELECT user_id FROM playlists WHERE id = :id");
        $checkStmt->execute([':id' => $playlistId]);
        $ownerId = $checkStmt->fetchColumn();

        if ($ownerId === false || (int)$ownerId !== $user['id']) {
            jsonError('You do not have permission to remove tracks from this playlist.', 403);
        }

        $delStmt = $db->prepare("DELETE FROM playlist_tracks WHERE playlist_id = :p AND track_id = :t");
        $delStmt->execute([':p' => $playlistId, ':t' => $trackId]);

        // Update playlist updated_at
        $db->prepare("UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = :id")->execute([':id' => $playlistId]);

        jsonResponse([
            'success' => true,
            'message' => 'Track removed from playlist.'
        ]);
    }

    jsonError('Unknown playlist action.', 400);

} catch (Exception $e) {
    error_log("Playlists API error: " . $e->getMessage());
    jsonError("An unexpected server error occurred while processing playlist request.", 500);
}

