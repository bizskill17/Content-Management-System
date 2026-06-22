<?php
require_once 'config.php';
$data = json_input();
if (empty($data['email']) || empty($data['password'])) json_response(['status' => 'error', 'message' => 'Email and password are required'], 422);
$stmt = $conn->prepare('SELECT id, password FROM users WHERE email = ?');
$stmt->execute([strtolower(trim($data['email']))]);
$record = $stmt->fetch();
if (!$record || !password_verify($data['password'], $record['password'])) json_response(['status' => 'error', 'message' => 'Invalid email or password'], 401);
$csrf = issue_session($conn, (int)$record['id']);
$user = current_user($conn);
json_response(['status' => 'success', 'user' => public_user($user), 'csrf_token' => $csrf]);
?>
