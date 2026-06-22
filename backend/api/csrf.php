<?php
require_once 'config.php';
$user = require_user($conn, false);
$csrf = bin2hex(random_bytes(24));
$token = $_COOKIE[SESSION_COOKIE] ?? '';
$stmt = $conn->prepare('UPDATE auth_sessions SET csrf_hash=? WHERE token_hash=?');
$stmt->execute([hash('sha256', $csrf), hash('sha256', $token)]);
json_response(['status' => 'success', 'csrf_token' => $csrf]);
?>
