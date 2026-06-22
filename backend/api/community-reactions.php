<?php
require_once 'community-lib.php';
$user = require_user($conn);
$data = json_input();
$post_id = (int)($data['post_id'] ?? 0);
if (!$post_id) json_response(['status' => 'error', 'message' => 'Post ID is required'], 422);
$access = post_access($conn, $post_id, $user, false);
if (!$access['allowed'] || empty($access['unlocked'])) json_response(['status' => 'error', 'message' => 'Open this post before reacting'], 403);
$exists = $conn->prepare('SELECT 1 FROM community_reactions WHERE post_id=? AND user_id=?');
$exists->execute([$post_id, $user['id']]);
if ($exists->fetchColumn()) {
    $conn->prepare('DELETE FROM community_reactions WHERE post_id=? AND user_id=?')->execute([$post_id, $user['id']]);
    $liked = false;
} else {
    try { $conn->prepare('INSERT INTO community_reactions (post_id,user_id) VALUES (?,?)')->execute([$post_id, $user['id']]); }
    catch (PDOException $e) { json_response(['status' => 'error', 'message' => 'Post not found'], 404); }
    $liked = true;
}
$count = $conn->prepare('SELECT COUNT(*) FROM community_reactions WHERE post_id=?');
$count->execute([$post_id]);
json_response(['status' => 'success', 'liked' => $liked, 'count' => (int)$count->fetchColumn()]);
?>
