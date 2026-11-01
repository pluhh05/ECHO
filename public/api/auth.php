<?php
/**
 * ECHO — User Authentication API Endpoint
 * Handles login, registration, session status, and logout.
 * Uses PDO prepared statements, bcrypt hashing, and CSRF protection.
 */

require_once __DIR__ . '/../../app/config/database.php';
require_once __DIR__ . '/../../app/includes/auth_helper.php';

startSecureSession();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    $db = Database::getConnection();

    // ----------------------------------------------------------------
    // 1. GET ?action=me — Check current session status & retrieve CSRF token
    // ----------------------------------------------------------------
    if ($method === 'GET' && $action === 'me') {
        $user = getAuthUser();
        jsonResponse([
            'success'    => true,
            'user'       => $user,
            'csrf_token' => getCsrfToken()
        ]);
    }

    // ----------------------------------------------------------------
    // 2. POST ?action=login — Authenticate existing user
    // ----------------------------------------------------------------
    if ($method === 'POST' && $action === 'login') {
        $input = getJsonInput();
        $usernameOrEmail = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';

        if (empty($usernameOrEmail) || empty($password)) {
            jsonError('Please provide both username/email and password.', 422);
        }

        $stmt = $db->prepare("
            SELECT id, username, email, password_hash 
            FROM users 
            WHERE username = :identifier OR email = :identifier 
            LIMIT 1
        ");
        $stmt->execute([':identifier' => $usernameOrEmail]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            jsonError('Invalid credentials. Please check your username/email and password.', 401);
        }

        // Prevent session fixation
        session_regenerate_id(true);

        $_SESSION['user'] = [
            'id'       => (int)$user['id'],
            'username' => $user['username'],
            'email'    => $user['email']
        ];

        jsonResponse([
            'success'    => true,
            'message'    => 'Login successful. Welcome back!',
            'user'       => $_SESSION['user'],
            'csrf_token' => getCsrfToken()
        ]);
    }

    // ----------------------------------------------------------------
    // 3. POST ?action=register — Register new user account
    // ----------------------------------------------------------------
    if ($method === 'POST' && $action === 'register') {
        $input = getJsonInput();
        $username = trim($input['username'] ?? '');
        $email    = trim(strtolower($input['email'] ?? ''));
        $password = $input['password'] ?? '';

        $errors = [];

        // Validation: Username
        if (strlen($username) < 3 || strlen($username) > 50) {
            $errors['username'] = 'Username must be between 3 and 50 characters.';
        } elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
            $errors['username'] = 'Username can only contain letters, numbers, and underscores.';
        }

        // Validation: Email
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Please enter a valid email address.';
        }

        // Validation: Password
        if (strlen($password) < 8) {
            $errors['password'] = 'Password must be at least 8 characters long.';
        }

        if (!empty($errors)) {
            jsonError('Validation failed. Please correct the highlighted errors.', 422, $errors);
        }

        // Check uniqueness of username and email
        $checkStmt = $db->prepare("SELECT username, email FROM users WHERE username = :u OR email = :e LIMIT 1");
        $checkStmt->execute([':u' => $username, ':e' => $email]);
        $existing = $checkStmt->fetch();

        if ($existing) {
            if (strcasecmp($existing['username'], $username) === 0) {
                jsonError('That username is already taken. Please choose another.', 409);
            }
            if (strcasecmp($existing['email'], $email) === 0) {
                jsonError('That email address is already registered. Please sign in.', 409);
            }
        }

        // Secure password hashing using bcrypt
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $insertStmt = $db->prepare("
            INSERT INTO users (username, email, password_hash) 
            VALUES (:username, :email, :password_hash)
        ");
        $insertStmt->execute([
            ':username'      => $username,
            ':email'         => $email,
            ':password_hash' => $passwordHash
        ]);

        $newUserId = (int)$db->lastInsertId();

        // Regenerate session and log in automatically
        session_regenerate_id(true);
        $_SESSION['user'] = [
            'id'       => $newUserId,
            'username' => $username,
            'email'    => $email
        ];

        jsonResponse([
            'success'    => true,
            'message'    => 'Account created successfully. Welcome to ECHO!',
            'user'       => $_SESSION['user'],
            'csrf_token' => getCsrfToken()
        ], 201);
    }

    // ----------------------------------------------------------------
    // 4. POST ?action=logout — End session and invalidate cookies
    // ----------------------------------------------------------------
    if ($method === 'POST' && $action === 'logout') {
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();

        jsonResponse([
            'success' => true,
            'message' => 'Logged out successfully.'
        ]);
    }

    // Invalid route/method
    jsonError("Invalid action or HTTP method for authentication endpoint.", 404);

} catch (Exception $e) {
    error_log("Auth API error: " . $e->getMessage());
    jsonError("An unexpected server error occurred. Please try again later.", 500);
}

