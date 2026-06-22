<?php
require_once 'community-lib.php';
$user = require_user($conn);
$method = $_SERVER['REQUEST_METHOD'];
$data = json_input();

if ($method === 'POST') {
    $post_id = (int)($data['post_id'] ?? 0);
    $parent_id = !empty($data['parent_id']) ? (int)$data['parent_id'] : null;
    $body = clean_community_html($data['body_html'] ?? '');
    if (!$post_id || trim(strip_tags($body)) === '') json_response(['status' => 'error', 'message' => 'Comment content is required'], 422);
    $post = $conn->prepare("SELECT comments_locked FROM community_posts WHERE id=? AND status='published'");
    $post->execute([$post_id]);
    $record = $post->fetch();
    if (!$record) json_response(['status' => 'error', 'message' => 'Post not found'], 404);
    if ($record['comments_locked']) json_response(['status' => 'error', 'message' => 'Comments are locked'], 423);
    $access = post_access($conn, $post_id, $user, false);
    if (!$access['allowed'] || empty($access['unlocked'])) json_response(['status' => 'error', 'message' => 'Open this post before commenting'], 403);
    if ($parent_id) {
        $parent = $conn->prepare("SELECT parent_id FROM community_comments WHERE id=? AND post_id=? AND status='published'");
        $parent->execute([$parent_id, $post_id]);
        $parent_record = $parent->fetch();
        if (!$parent_record || $parent_record['parent_id']) json_response(['status' => 'error', 'message' => 'Replies can only be nested one level'], 422);
    }
    $stmt = $conn->prepare('INSERT INTO community_comments (post_id,user_id,parent_id,body_html) VALUES (?,?,?,?)');
    $stmt->execute([$post_id, $user['id'], $parent_id, $body]);
    json_response(['status' => 'success', 'id' => (int)$conn->lastInsertId()], 201);
}

$id = (int)($data['id'] ?? 0);
$stmt = $conn->prepare('SELECT * FROM community_comments WHERE id=?');
$stmt->execute([$id]);
$comment = $stmt->fetch();
if (!$comment) json_response(['status' => 'error', 'message' => 'Comment not found'], 404);
if ((int)$comment['user_id'] !== (int)$user['id'] && $user['role'] !== 'admin') json_response(['status' => 'error', 'message' => 'Not allowed'], 403);
if ($method === 'PATCH') {
    $body = clean_community_html($data['body_html'] ?? '');
    if (trim(strip_tags($body)) === '') json_response(['status' => 'error', 'message' => 'Comment cannot be empty'], 422);
    $conn->prepare('UPDATE community_comments SET body_html=? WHERE id=?')->execute([$body, $id]);
} elseif ($method === 'DELETE') {
    $conn->prepare("UPDATE community_comments SET status='deleted' WHERE id=?")->execute([$id]);
} else json_response(['status' => 'error', 'message' => 'Method not allowed'], 405);
json_response(['status' => 'success']);
?>
