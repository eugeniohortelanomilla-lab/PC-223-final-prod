<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$data     = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$password = $data['password']      ?? '';

if (!$username || !$password) {
    echo json_encode(['success' => false, 'error' => 'Username and password are required.']);
    exit;
}

$stmt = $mysqli->prepare('SELECT id, username, password, name, role FROM users WHERE username = ? LIMIT 1');

if (!$stmt) {
    echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $mysqli->error]);
    exit;
}

$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result();
$user   = $result->fetch_assoc();

if ($user && password_verify($password, $user['password'])) {
    unset($user['password']);
    echo json_encode(['success' => true, 'user' => $user]);
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid username or password.']);
}

$stmt->close();
$mysqli->close();