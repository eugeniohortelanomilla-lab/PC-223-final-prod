<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$data      = json_decode(file_get_contents('php://input'), true);
$userId    = intval($data['user_id']   ?? 0);
$username  = trim($data['username']    ?? '');
$facility  = trim($data['facility']    ?? '');
$name      = trim($data['name']        ?? '');
$sid       = trim($data['sid']         ?? '');
$date      = trim($data['date']        ?? '');
$time      = trim($data['time']        ?? '');
$pax       = intval($data['pax']       ?? 0);
$purpose   = trim($data['purpose']     ?? '');

if (!$username || !$facility || !$name || !$sid || !$date || !$time || !$pax || !$purpose) {
    echo json_encode(['success' => false, 'error' => 'All required booking fields must be filled.']);
    exit;
}

// FIX: 9 columns = 9 ? placeholders = 'isssssssi' (1 int + 6 strings + 1 int + 1 string... recount below)
// user_id(i), username(s), facility(s), name(s), sid(s), date(s), time_slot(s), pax(i), purpose(s) = 'issssssis'
$stmt = $mysqli->prepare(
    'INSERT INTO bookings 
        (user_id, username, facility, name, sid, date, time_slot, pax, purpose, status, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "Pending", NOW())'
);

if (!$stmt) {
    echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $mysqli->error]);
    exit;
}

// user_id=i, username=s, facility=s, name=s, sid=s, date=s, time=s, pax=i, purpose=s
$stmt->bind_param('issssssis',
    $userId,
    $username,
    $facility,
    $name,
    $sid,
    $date,
    $time,
    $pax,
    $purpose
);

$success = $stmt->execute();

if ($success) {
    echo json_encode(['success' => true, 'booking_id' => $stmt->insert_id]);
} else {
    echo json_encode(['success' => false, 'error' => 'Unable to save booking: ' . $stmt->error]);
}

$stmt->close();
$mysqli->close();