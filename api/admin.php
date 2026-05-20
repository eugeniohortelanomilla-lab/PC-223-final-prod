<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once 'config.php';

function send_json($data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $type = $_GET['type'] ?? '';

    if ($type === 'borrow_requests') {
        $rows = [];
        $res = $mysqli->query('SELECT id, user_id, username, role, name, id_num, course, section, book_title, book_author, date_needed, purpose, status, submitted_at, approved_at, returned_at, rejection_reason FROM borrow_requests ORDER BY submitted_at DESC');
        if ($res) {
            while ($r = $res->fetch_assoc()) {
                $rows[] = $r;
            }
        }
        send_json(['success' => true, 'data' => $rows]);
    }

    if ($type === 'bookings') {
        $rows = [];
        $res = $mysqli->query('SELECT id, user_id, username, facility, name, sid, date, time_slot, pax, purpose, status, created_at FROM bookings ORDER BY created_at DESC');
        if ($res) {
            while ($r = $res->fetch_assoc()) {
                $rows[] = $r;
            }
        }
        send_json(['success' => true, 'data' => $rows]);
    }

    send_json(['success' => false, 'error' => 'Invalid type parameter'], 400);
}

api_require_post();
$payload = json_decode(file_get_contents('php://input'), true) ?: [];
$action = $payload['action'] ?? '';

if ($action === 'borrow_status') {
    $id = intval($payload['id'] ?? 0);
    $status = trim($payload['status'] ?? '');
    $reason = trim($payload['rejection_reason'] ?? '');

    if (!$id || !in_array($status, ['Pending', 'Approved', 'Rejected', 'Returned'], true)) {
        send_json(['success' => false, 'error' => 'Invalid borrow status payload'], 400);
    }

    if ($status === 'Approved') {
        $stmt = $mysqli->prepare('UPDATE borrow_requests SET status = "Approved", approved_at = NOW(), rejection_reason = NULL WHERE id = ?');
        $stmt->bind_param('i', $id);
    } elseif ($status === 'Rejected') {
        $stmt = $mysqli->prepare('UPDATE borrow_requests SET status = "Rejected", rejection_reason = ?, approved_at = NULL WHERE id = ?');
        $stmt->bind_param('si', $reason, $id);
    } elseif ($status === 'Returned') {
        $stmt = $mysqli->prepare('UPDATE borrow_requests SET status = "Returned", returned_at = NOW() WHERE id = ?');
        $stmt->bind_param('i', $id);
    } else {
        $stmt = $mysqli->prepare('UPDATE borrow_requests SET status = "Pending", approved_at = NULL, returned_at = NULL, rejection_reason = NULL WHERE id = ?');
        $stmt->bind_param('i', $id);
    }

    if (!$stmt) {
        send_json(['success' => false, 'error' => 'Prepare failed: ' . $mysqli->error], 500);
    }
    $ok = $stmt->execute();
    $stmt->close();
    send_json(['success' => (bool) $ok]);
}

if ($action === 'booking_status') {
    $id = intval($payload['id'] ?? 0);
    $status = trim($payload['status'] ?? '');
    if (!$id || !in_array($status, ['Pending', 'Confirmed'], true)) {
        send_json(['success' => false, 'error' => 'Invalid booking status payload'], 400);
    }
    $stmt = $mysqli->prepare('UPDATE bookings SET status = ? WHERE id = ?');
    if (!$stmt) {
        send_json(['success' => false, 'error' => 'Prepare failed: ' . $mysqli->error], 500);
    }
    $stmt->bind_param('si', $status, $id);
    $ok = $stmt->execute();
    $stmt->close();
    send_json(['success' => (bool) $ok]);
}

if ($action === 'booking_delete') {
    $id = intval($payload['id'] ?? 0);
    if (!$id) {
        send_json(['success' => false, 'error' => 'Invalid booking id'], 400);
    }
    $stmt = $mysqli->prepare('DELETE FROM bookings WHERE id = ?');
    if (!$stmt) {
        send_json(['success' => false, 'error' => 'Prepare failed: ' . $mysqli->error], 500);
    }
    $stmt->bind_param('i', $id);
    $ok = $stmt->execute();
    $stmt->close();
    send_json(['success' => (bool) $ok]);
}

send_json(['success' => false, 'error' => 'Invalid action'], 400);
