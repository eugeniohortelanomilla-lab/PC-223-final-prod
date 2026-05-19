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
$name     = trim($data['name']     ?? '');
$role     = trim($data['role']     ?? 'Student');

if (!$username || !$password || !$name) {
    echo json_encode(['success' => false, 'error' => 'All fields are required.']);
    exit;
}

// Check duplicate username
$stmt = $mysqli->prepare('SELECT id FROM users WHERE username = ?');

if (!$stmt) {
    echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $mysqli->error]);
    exit;
}

$stmt->bind_param('s', $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode(['success' => false, 'error' => 'Username already exists.']);
    exit;
}
$stmt->close();

// Insert new user
$passwordHash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $mysqli->prepare('INSERT INTO users (username, password, name, role, created_at) VALUES (?, ?, ?, ?, NOW())');

if (!$stmt) {
    echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $mysqli->error]);
    exit;
}

$stmt->bind_param('ssss', $username, $passwordHash, $name, $role);
$success = $stmt->execute();

if ($success) {
    $id = $stmt->insert_id;
    echo json_encode(['success' => true, 'user' => [
        'id'       => $id,
        'username' => $username,
        'name'     => $name,
        'role'     => $role
    ]]);
} else {
    echo json_encode(['success' => false, 'error' => 'Unable to create account: ' . $stmt->error]);
}

$stmt->close();
$mysqli->close();