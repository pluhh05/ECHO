<?php
/**
 * ECHO — Database Connection Configuration
 * PDO with UTF-8 mb4, prepared statements, and secure error isolation.
 * Works out-of-the-box with standard XAMPP MySQL / MariaDB.
 */

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $host = getenv('DB_HOST') ?: 'localhost';
            $port = getenv('DB_PORT') ?: '3306';
            $db   = getenv('DB_NAME') ?: 'echo_db';
            $user = getenv('DB_USER') ?: 'root';
            $pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
            $charset = 'utf8mb4';

            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset={$charset}";

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset} COLLATE utf8mb4_unicode_ci"
            ];

            try {
                self::$instance = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                // Log internal error safely for developers without leaking credentials to client
                error_log("Database connection failed: " . $e->getMessage());

                // If called in an API context, emit clean JSON error and terminate
                if (php_sapi_name() !== 'cli') {
                    http_response_code(503);
                    header('Content-Type: application/json; charset=utf-8');
                    echo json_encode([
                        'success' => false,
                        'message' => 'Database service unavailable. Please check that MySQL/XAMPP is running and database "echo_db" is created.'
                    ]);
                    exit;
                }
                throw new Exception("Database connection failure. Please verify database service.");
            }
        }

        return self::$instance;
    }
}

