<?php
/**
 * ECHO — Authentication, Session & CSRF Security Helper
 * Handles secure session cookies, CSRF tokens, input parsing, and JSON responses.
 */

// Initialize hardened session
function startSecureSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        $cookieParams = [
            'lifetime' => 60 * 60 * 24 * 7, // 7 days
            'path' => '/',
            'httponly' => true,             // Mitigate XSS cookie harvesting
            'samesite' => 'Lax'             // Mitigate CSRF on top-level navigations
        ];

        // Enable secure flag only over HTTPS
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            $cookieParams['secure'] = true;
        }

        session_set_cookie_params($cookieParams);
        session_start();
    }
}

// Generate or retrieve current CSRF token
function getCsrfToken(): string {
    startSecureSession();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// Verify incoming CSRF token on state-changing operations (POST, PUT, DELETE)
function verifyCsrfToken(): bool {
    startSecureSession();
    $expected = $_SESSION['csrf_token'] ?? '';
    if (empty($expected)) {
        return false;
    }

    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? '';
    return hash_equals($expected, $provided);
}

// Enforce CSRF verification or terminate with 403
function requireCsrf(): void {
    if (!verifyCsrfToken()) {
        jsonError('Security verification failed (Invalid or missing CSRF token). Please refresh and try again.', 403);
    }
}

// Get logged-in user or null
function getAuthUser(): ?array {
    startSecureSession();
    return $_SESSION['user'] ?? null;
}

// Enforce authenticated session or terminate with 401
function requireAuth(): array {
    $user = getAuthUser();
    if (!$user) {
        jsonError('Authentication required. Please sign in to continue.', 401);
    }
    return $user;
}

// Parse JSON request body
function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }
    return $_POST ?: [];
}

// Unified JSON response
function jsonResponse(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    
    // Always attach active CSRF token in header for client Fetch API convenience
    if (session_status() === PHP_SESSION_ACTIVE && !empty($_SESSION['csrf_token'])) {
        header('X-CSRF-Token: ' . $_SESSION['csrf_token']);
    }

    echo json_encode($data);
    exit;
}

// Unified JSON error response
function jsonError(string $message, int $statusCode = 400, array $errors = []): void {
    jsonResponse([
        'success' => false,
        'message' => $message,
        'errors'  => $errors
    ], $statusCode);
}

