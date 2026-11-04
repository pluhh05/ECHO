<?php
/**
 * ECHO — Automated Test Suite (Stage 4: Presentation & Viva Readiness)
 * 
 * Verifies:
 *  1. Database Schema & Integrity
 *  2. Authentication & Session Flow
 *  3. Catalogue, Search & Detail Endpoints (Student 1)
 *  4. Playlists, Duplicates & Reordering (Student 2)
 *  5. Library, Likes & History Tracking (Student 2)
 * 
 * Usage:
 *   C:\xampp\php\php.exe tests/run_tests.php
 */

declare(strict_types=1);

$baseUrl = 'http://localhost:8000/api';
$cookieFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'echo_test_cookie_' . uniqid() . '.txt';

$totalTests = 0;
$passedTests = 0;
$failedTests = 0;

function printHeader(string $title): void {
    echo "\n\033[1;35m====================================================\033[0m\n";
    echo "\033[1;37m " . $title . "\033[0m\n";
    echo "\033[1;35m====================================================\033[0m\n";
}

function assertTest(string $name, bool $condition, string $details = ''): void {
    global $totalTests, $passedTests, $failedTests;
    $totalTests++;
    if ($condition) {
        $passedTests++;
        echo "  \033[32m✔ PASS\033[0m: " . $name . "\n";
    } else {
        $failedTests++;
        echo "  \033[31m✖ FAIL\033[0m: " . $name . "\n";
        if (!empty($details)) {
            echo "    \033[33mReason: " . $details . "\033[0m\n";
        }
    }
}

function httpRequest(string $url, string $method = 'GET', ?array $data = null, array $headers = []): array {
    global $cookieFile;
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);

    $finalHeaders = $headers;
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data !== null) {
            $payload = json_encode($data);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            $finalHeaders[] = 'Content-Type: application/json';
        }
    }

    if (!empty($finalHeaders)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $finalHeaders);
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    $json = null;
    if ($response !== false) {
        $json = json_decode($response, true);
    }

    return [
        'code'     => $httpCode,
        'raw'      => $response,
        'json'     => $json,
        'curl_err' => $curlErr
    ];
}

// ====================================================================
// SUITE 1: Database Direct Verification
// ====================================================================
printHeader('Suite 1: Database Connection & Schema Verification');

require_once __DIR__ . '/../app/config/database.php';

try {
    $db = Database::getConnection();
    assertTest('Direct PDO connection to MySQL database succeeded', $db instanceof PDO);

    $tablesStmt = $db->query("SHOW TABLES");
    $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);

    $expectedTables = ['users', 'artists', 'albums', 'tracks', 'track_artists', 'genres', 'track_genres', 'playlists', 'playlist_tracks', 'liked_tracks', 'saved_artists', 'recent_tracks'];
    $missing = array_diff($expectedTables, $tables);
    assertTest('All 12 required tables present in database schema', empty($missing), 'Missing: ' . implode(', ', $missing));

    $trackCount = (int)$db->query("SELECT COUNT(*) FROM tracks")->fetchColumn();
    assertTest('Catalogue seeded with audio tracks', $trackCount > 0, "Found: {$trackCount} tracks");

    $genreCount = (int)$db->query("SELECT COUNT(*) FROM genres")->fetchColumn();
    assertTest('Catalogue seeded with musical genres', $genreCount >= 5, "Found: {$genreCount} genres");

} catch (Exception $e) {
    assertTest('Database connectivity failed', false, $e->getMessage());
}

// ====================================================================
// SUITE 2: Catalogue & Discovery Endpoints (Student 1)
// ====================================================================
printHeader('Suite 2: Catalogue & Discovery API Endpoints');

// 1. Discover
$res = httpRequest($baseUrl . '/catalogue.php?action=discover');
assertTest('GET catalogue.php?action=discover returns HTTP 200', $res['code'] === 200);
assertTest('Discover payload contains hero, picks, artists, releases', 
    isset($res['json']['hero'], $res['json']['picks'], $res['json']['artists'], $res['json']['new_releases']));
assertTest('Discover picks contain at least 4 tracks', 
    is_array($res['json']['picks'] ?? null) && count($res['json']['picks']) >= 4);

// 2. Genres
$res = httpRequest($baseUrl . '/catalogue.php?action=genres');
assertTest('GET catalogue.php?action=genres returns HTTP 200', $res['code'] === 200);
assertTest('Genres list contains items with slug and track_count', 
    isset($res['json']['genres'][0]['slug'], $res['json']['genres'][0]['track_count']));

// 3. Tracks with genre filter
$res = httpRequest($baseUrl . '/catalogue.php?action=tracks&genre=synthwave');
assertTest('GET catalogue.php?action=tracks with genre filter returns 200', $res['code'] === 200);
assertTest('Filtered tracks array is not empty', 
    is_array($res['json']['tracks'] ?? null) && count($res['json']['tracks']) > 0);

// 4. Multi-entity search
$res = httpRequest($baseUrl . '/catalogue.php?action=search&q=Neon');
assertTest('GET catalogue.php?action=search returns HTTP 200', $res['code'] === 200);
assertTest('Search returns matching entities structure', 
    isset($res['json']['tracks'], $res['json']['artists'], $res['json']['albums']));

// 5. Track Detail
$res = httpRequest($baseUrl . '/catalogue.php?action=track_detail&id=1');
assertTest('GET catalogue.php?action=track_detail returns HTTP 200', $res['code'] === 200);
assertTest('Track detail contains metadata and credits', 
    isset($res['json']['track']['title'], $res['json']['track']['artists']));

// 6. Artist Detail
$res = httpRequest($baseUrl . '/catalogue.php?action=artist_detail&id=1');
assertTest('GET catalogue.php?action=artist_detail returns HTTP 200', $res['code'] === 200);
assertTest('Artist detail contains bio, top_tracks and albums', 
    isset($res['json']['artist']['name'], $res['json']['top_tracks'], $res['json']['albums']));

// 7. Album Detail
$res = httpRequest($baseUrl . '/catalogue.php?action=album_detail&id=1');
assertTest('GET catalogue.php?action=album_detail returns HTTP 200', $res['code'] === 200);
assertTest('Album detail contains track list with duration', 
    isset($res['json']['album']['title'], $res['json']['tracks'][0]['duration_seconds']));

// 8. Recommendations (Guest)
$res = httpRequest($baseUrl . '/catalogue.php?action=recommendations');
assertTest('GET catalogue.php?action=recommendations returns 200 for guest', $res['code'] === 200);
assertTest('Guest recommendations fall back to curated picks', 
    isset($res['json']['tracks']) && is_array($res['json']['tracks']));

// ====================================================================
// SUITE 3: Auth & Security Flow
// ====================================================================
printHeader('Suite 3: Authentication & CSRF Security');

// 1. Initial Me check (unauthenticated)
$res = httpRequest($baseUrl . '/auth.php?action=me');
assertTest('Initial session reports authenticated = false', 
    $res['code'] === 200 && ($res['json']['authenticated'] ?? null) === false);
$csrfToken = $res['json']['csrf_token'] ?? '';
assertTest('Session initialization generates valid CSRF token', !empty($csrfToken));

// 2. Register test user
$testUsername = 'test_runner_' . time();
$testEmail = $testUsername . '@echo.mit.edu';
$testPassword = 'Password123!';

$res = httpRequest($baseUrl . '/auth.php?action=register', 'POST', [
    'username' => $testUsername,
    'email'    => $testEmail,
    'password' => $testPassword
]);
assertTest('POST auth.php?action=register succeeds (HTTP 201)', $res['code'] === 201);
assertTest('Register response indicates success', ($res['json']['success'] ?? false) === true);

// 3. Prevent duplicate username
$dupRes = httpRequest($baseUrl . '/auth.php?action=register', 'POST', [
    'username' => $testUsername,
    'email'    => 'another_' . $testEmail,
    'password' => $testPassword
]);
assertTest('Duplicate registration returns HTTP 409 Conflict', $dupRes['code'] === 409);

// 4. Logout
$res = httpRequest($baseUrl . '/auth.php?action=logout', 'POST');
assertTest('POST auth.php?action=logout succeeds', $res['code'] === 200);

// 5. Login with invalid password
$badLogin = httpRequest($baseUrl . '/auth.php?action=login', 'POST', [
    'username' => $testUsername,
    'password' => 'WrongPassword!'
]);
assertTest('Login with incorrect password returns HTTP 401', $badLogin['code'] === 401);

// 6. Login with correct credentials
$goodLogin = httpRequest($baseUrl . '/auth.php?action=login', 'POST', [
    'username' => $testUsername,
    'password' => $testPassword
]);
assertTest('Login with correct credentials succeeds (HTTP 200)', $goodLogin['code'] === 200);
$csrfToken = $goodLogin['json']['csrf_token'] ?? $csrfToken;

// 7. Verify authenticated state
$meRes = httpRequest($baseUrl . '/auth.php?action=me');
assertTest('Session me reports authenticated = true for logged-in user', 
    ($meRes['json']['authenticated'] ?? false) === true && ($meRes['json']['user']['username'] ?? '') === $testUsername);

// ====================================================================
// SUITE 4: Playlists & Reordering (Student 2)
// ====================================================================
printHeader('Suite 4: Playlists CRUD, Duplicate Prevention & Drag Reordering');

$authHeader = ['X-CSRF-Token: ' . $csrfToken];

// 1. Create Playlist
$createRes = httpRequest($baseUrl . '/playlists.php?action=create', 'POST', [
    'title'       => 'Automated Test Playlist',
    'description' => 'Created during test suite verification.'
], $authHeader);
assertTest('POST playlists.php?action=create returns HTTP 201', $createRes['code'] === 201);
$playlistId = (int)($createRes['json']['playlist_id'] ?? 0);
assertTest('New playlist assigned valid positive ID', $playlistId > 0);

// 2. List Playlists
$listRes = httpRequest($baseUrl . '/playlists.php?action=list', 'GET', null, $authHeader);
assertTest('GET playlists.php?action=list returns user playlists', 
    $listRes['code'] === 200 && count($listRes['json']['playlists'] ?? []) >= 1);

// 3. Add Track #1
$addRes1 = httpRequest($baseUrl . '/playlists.php?action=add_track', 'POST', [
    'playlist_id' => $playlistId,
    'track_id'    => 1
], $authHeader);
assertTest('POST playlists.php?action=add_track adds first song', $addRes1['code'] === 200);

// 4. Duplicate prevention test
$dupTrackRes = httpRequest($baseUrl . '/playlists.php?action=add_track', 'POST', [
    'playlist_id' => $playlistId,
    'track_id'    => 1
], $authHeader);
assertTest('Adding same track again returns HTTP 409 Conflict (Duplicate Prevention)', $dupTrackRes['code'] === 409);

// 5. Add Track #2
$addRes2 = httpRequest($baseUrl . '/playlists.php?action=add_track', 'POST', [
    'playlist_id' => $playlistId,
    'track_id'    => 4
], $authHeader);
assertTest('Adding second track succeeds', $addRes2['code'] === 200);

// 6. Test Reorder Endpoint (simulating drag-and-drop order reversal)
$reorderRes = httpRequest($baseUrl . '/playlists.php?action=reorder', 'POST', [
    'playlist_id' => $playlistId,
    'track_ids'   => [4, 1] // Reverse order
], $authHeader);
assertTest('POST playlists.php?action=reorder persists new position indices', $reorderRes['code'] === 200);

// 7. Verify positions via GET playlist
$getPlRes = httpRequest($baseUrl . '/playlists.php?action=get&id=' . $playlistId, 'GET', null, $authHeader);
$tracks = $getPlRes['json']['playlist']['tracks'] ?? [];
assertTest('Reordered playlist reflects reversed order in database', 
    count($tracks) === 2 && (int)($tracks[0]['id'] ?? 0) === 4 && (int)($tracks[1]['id'] ?? 0) === 1);

// 8. Remove track
$removeRes = httpRequest($baseUrl . '/playlists.php?action=remove_track', 'POST', [
    'playlist_id' => $playlistId,
    'track_id'    => 1
], $authHeader);
assertTest('POST playlists.php?action=remove_track removes song from playlist', $removeRes['code'] === 200);

// 9. Delete playlist
$delRes = httpRequest($baseUrl . '/playlists.php?action=delete', 'POST', [
    'id' => $playlistId
], $authHeader);
assertTest('POST playlists.php?action=delete deletes playlist successfully', $delRes['code'] === 200);

// ====================================================================
// SUITE 5: Library & Recommendations (Student 2)
// ====================================================================
printHeader('Suite 5: Library, Liked Tracks & Listening History');

// 1. Toggle like on track 1
$likeRes = httpRequest($baseUrl . '/library.php?action=toggle_like', 'POST', ['track_id' => 1], $authHeader);
assertTest('POST library.php?action=toggle_like likes track (HTTP 200)', $likeRes['code'] === 200 && ($likeRes['json']['liked'] ?? false) === true);

// 2. Fetch liked tracks
$likedList = httpRequest($baseUrl . '/library.php?action=liked', 'GET', null, $authHeader);
assertTest('GET library.php?action=liked returns liked tracks', 
    $likedList['code'] === 200 && count($likedList['json']['liked_tracks'] ?? []) >= 1);

// 3. Recommendations now personalized based on liked track genre
$recRes2 = httpRequest($baseUrl . '/catalogue.php?action=recommendations', 'GET', null, $authHeader);
assertTest('Personalised recommendations endpoint returns tracks for user with likes', 
    $recRes2['code'] === 200 && ($recRes2['json']['personalised'] ?? false) === true);

// 4. Record recent track play
$recPlay = httpRequest($baseUrl . '/library.php?action=record_recent', 'POST', ['track_id' => 4], $authHeader);
assertTest('POST library.php?action=record_recent logs track play', $recPlay['code'] === 200);

// 5. Fetch recently played
$recentList = httpRequest($baseUrl . '/library.php?action=recent', 'GET', null, $authHeader);
assertTest('GET library.php?action=recent contains logged track', 
    $recentList['code'] === 200 && count($recentList['json']['recent_tracks'] ?? []) >= 1);

// Cleanup cookie file
if (file_exists($cookieFile)) {
    unlink($cookieFile);
}

// ====================================================================
// SUMMARY REPORT
// ====================================================================
echo "\n\033[1;36m====================================================\033[0m\n";
echo " \033[1;37mTEST RUN COMPLETED\033[0m\n";
echo " Total Assertions: \033[1m{$totalTests}\033[0m\n";
echo " Passed:           \033[32m{$passedTests}\033[0m\n";
echo " Failed:           \033[31m{$failedTests}\033[0m\n";
echo "\033[1;36m====================================================\033[0m\n";

exit($failedTests === 0 ? 0 : 1);

