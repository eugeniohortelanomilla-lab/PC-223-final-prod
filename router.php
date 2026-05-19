<?php
/**
 * Railway / PHP built-in server router.
 * Handles OPTIONS before API scripts and serves static files.
 */
$uri  = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$path = $uri === false ? '/' : $uri;

$apiScripts = [
    '/api/health.php'   => __DIR__ . '/api/health.php',
    '/api/login.php'    => __DIR__ . '/api/login.php',
    '/api/register.php' => __DIR__ . '/api/register.php',
    '/api/borrow.php'   => __DIR__ . '/api/borrow.php',
    '/api/booking.php'  => __DIR__ . '/api/booking.php',
];

if (isset($apiScripts[$path])) {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, OPTIONS, GET');
        header('Access-Control-Allow-Headers: Content-Type');
        http_response_code(204);
        return true;
    }

    require $apiScripts[$path];
    return true;
}

$local = __DIR__ . $path;
if ($path !== '/' && is_file($local)) {
    return false;
}

if ($path === '/' || $path === '') {
    require __DIR__ . '/index.html';
    return true;
}

if (is_dir($local) && is_file($local . '/index.html')) {
    require $local . '/index.html';
    return true;
}

return false;
