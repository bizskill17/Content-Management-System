<?php
require_once 'config.php';
$user = require_user($conn);
$token = $_COOKIE[SESSION_COOKIE] ?? '';
$stmt = $conn->prepare('DELETE FROM auth_sessions WHERE token_hash = ?');
$stmt->execute([hash('sha256', $token)]);
set_session_cookie('', time() - 3600);
json_response(['status' => 'success']);
?>
