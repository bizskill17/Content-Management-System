<?php
require_once 'config.php';
$data = json_input();
foreach (['name', 'email', 'password', 'mobile'] as $field) {
    if (empty($data[$field])) json_response(['status' => 'error', 'message' => 'All fields are required'], 422);
}
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL) || strlen($data['password']) < 8) {
    json_response(['status' => 'error', 'message' => 'Use a valid email and a password of at least 8 characters'], 422);
}
try {
    $stmt = $conn->prepare('INSERT INTO users (name, email, password, mobile) VALUES (?, ?, ?, ?)');
    $stmt->execute([trim($data['name']), strtolower(trim($data['email'])), password_hash($data['password'], PASSWORD_DEFAULT), trim($data['mobile'])]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') json_response(['status' => 'error', 'message' => 'Email already registered'], 409);
    json_response(['status' => 'error', 'message' => 'Registration failed'], 500);
}
$csrf = issue_session($conn, (int)$conn->lastInsertId());
$user = current_user($conn);
json_response(['status' => 'success', 'user' => public_user($user), 'csrf_token' => $csrf], 201);
?>
