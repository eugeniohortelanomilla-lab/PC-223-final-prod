<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$data       = json_decode(file_get_contents('php://input'), true);
$userId     = intval($data['user_id']     ?? 0);
$username   = trim($data['username']      ?? '');
$role       = trim($data['role']          ?? 'Student');
$name       = trim($data['name']          ?? '');
$idNum      = trim($data['id_num']        ?? '');
$course     = trim($data['course']        ?? '');
$section    = trim($data['section']       ?? '');
$bookTitle  = trim($data['book_title']    ?? '');
$bookAuthor = trim($data['book_author']   ?? '');
$dateNeeded = trim($data['date_needed']   ?? '');
$purpose    = trim($data['purpose']       ?? '');

if (!$username || !$name || !$idNum || !$bookTitle || !$dateNeeded || !$purpose) {
    echo json_encode(['success' => false, 'error' => 'All required borrow fields must be filled.']);
    exit;
}

// FIX: 11 columns = 11 ? placeholders = 'isssssssss' (1 int + 10 strings)
$stmt = $mysqli->prepare(
    'INSERT INTO borrow_requests 
        (user_id, username, role, name, id_num, course, section, book_title, book_author, date_needed, purpose, status, submitted_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "Pending", NOW())'
);

if (!$stmt) {
    echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $mysqli->error]);
    exit;
}

// 1 int + 10 strings = 'isssssssss s' = 11 total
$stmt->bind_param('issssssssss',
    $userId,
    $username,
    $role,
    $name,
    $idNum,
    $course,
    $section,
    $bookTitle,
    $bookAuthor,
    $dateNeeded,
    $purpose
);

$success = $stmt->execute();

if ($success) {
    echo json_encode(['success' => true, 'request_id' => $stmt->insert_id]);
} else {
    echo json_encode(['success' => false, 'error' => 'Unable to save borrow request: ' . $stmt->error]);
}

$stmt->close();
$mysqli->close();