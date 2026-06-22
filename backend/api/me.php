<?php
require_once 'config.php';
$user = current_user($conn);
if (!$user) json_response(['status' => 'error', 'reason' => 'login_required', 'message' => 'Not authenticated'], 401);
json_response(['status' => 'success', 'user' => public_user($user)]);
?>
