<?php
error_reporting(0);
ini_set('display_errors', 0);

/**
 * CORS + OPTIONS preflight (must run before DB connect and before POST checks).
 */
function api_send_cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (!$origin) {
        return;
    }

    $allowed = getenv('CORS_ORIGIN') ?: '*';
    if ($allowed === '*' || $origin === $allowed) {
        header('Access-Control-Allow-Origin: ' . ($allowed === '*' ? '*' : $origin));
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Vary: Origin');
    }
}

function api_handle_preflight(): void
{
    api_send_cors();
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function api_require_post(): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method !== 'POST') {
        http_response_code(405);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        exit;
    }
}

api_handle_preflight();

header('Content-Type: application/json; charset=utf-8');

if (is_readable(__DIR__ . '/config.local.php')) {
    require __DIR__ . '/config.local.php';
}

/**
 * Read env var when set (Railway injects MYSQL* vars on the web service).
 */
function db_env(string $key, ?string $default = null): ?string
{
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }
    return $default;
}

/**
 * Parse mysql://user:pass@host:port/database (MYSQL_URL / DATABASE_URL).
 */
function db_config_from_url(string $url): ?array
{
    $parts = parse_url($url);
    if (!$parts || ($parts['scheme'] ?? '') !== 'mysql') {
        return null;
    }

    $host = $parts['host'] ?? null;
    $user = isset($parts['user']) ? urldecode($parts['user']) : null;
    $pass = isset($parts['pass']) ? urldecode($parts['pass']) : '';
    $db   = isset($parts['path']) ? ltrim($parts['path'], '/') : null;
    $port = isset($parts['port']) ? (int) $parts['port'] : 3306;

    if (!$host || !$user || !$db) {
        return null;
    }

    return compact('host', 'port', 'user', 'pass', 'db');
}

$host = $DB_HOST ?? null;
$port = isset($DB_PORT) ? (int) $DB_PORT : null;
$user = $DB_USER ?? null;
$pass = $DB_PASS ?? null;
$db   = $DB_NAME ?? null;

if ($host === null) {
    $url = db_env('MYSQL_URL') ?? db_env('DATABASE_URL');
    if ($url) {
        $parsed = db_config_from_url($url);
        if ($parsed) {
            $host = $parsed['host'];
            $port = $parsed['port'];
            $user = $parsed['user'];
            $pass = $parsed['pass'];
            $db   = $parsed['db'];
        }
    }
}

$host = $host ?? db_env('MYSQLHOST') ?? db_env('DB_HOST') ?? '127.0.0.1';
$port = $port ?? (int) (db_env('MYSQLPORT') ?? db_env('DB_PORT') ?? '3306');
$user = $user ?? db_env('MYSQLUSER') ?? db_env('DB_USER') ?? 'root';
$pass = $pass ?? db_env('MYSQLPASSWORD') ?? db_env('DB_PASSWORD') ?? db_env('DB_PASS') ?? '';
$db   = $db   ?? db_env('MYSQLDATABASE') ?? db_env('DB_NAME') ?? 'ctulibrarysystem';

$mysqli = new mysqli($host, $user, $pass, $db, $port);
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'DB connection failed: ' . $mysqli->connect_error,
    ]);
    exit;
}
$mysqli->set_charset('utf8mb4');
