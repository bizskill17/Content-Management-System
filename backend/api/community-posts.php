<?php
require_once 'community-lib.php';
$user = require_user($conn);
$method = $_SERVER['REQUEST_METHOD'];
$data = json_input();

if ($method === 'POST') {
    $space_id = (int)($data['space_id'] ?? 0);
    $body = clean_community_html($data['body_html'] ?? '');
    if (!$space_id || trim(strip_tags($body)) === '') json_response(['status' => 'error', 'message' => 'Space and post content are required'], 422);
    $space = $conn->prepare("SELECT id FROM community_spaces WHERE id=? AND status='active'");
    $space->execute([$space_id]);
    if (!$space->fetch()) json_response(['status' => 'error', 'message' => 'Space is unavailable'], 404);
    $stmt = $conn->prepare('INSERT INTO community_posts (space_id,user_id,body_html) VALUES (?,?,?)');
    $stmt->execute([$space_id, $user['id'], $body]);
    $post_id = (int)$conn->lastInsertId();
    $embeds = array_slice(array_values(array_unique($data['embeds'] ?? [])), 0, 4);
    $insert = $conn->prepare("INSERT INTO community_media (post_id,media_type,url,original_name,sort_order) VALUES (?,'embed',?,?,?)");
    foreach ($embeds as $i => $url) if ($normalized = normalize_embed((string)$url)) $insert->execute([$post_id, $normalized, 'Video embed', $i]);
    json_response(['status' => 'success', 'id' => $post_id], 201);
}

$post_id = (int)($data['id'] ?? 0);
if (!$post_id) json_response(['status' => 'error', 'message' => 'Post ID is required'], 422);
$post = post_owner_or_admin($conn, $post_id, $user);
if ($method === 'PATCH') {
    $body = clean_community_html($data['body_html'] ?? '');
    if (trim(strip_tags($body)) === '') json_response(['status' => 'error', 'message' => 'Post cannot be empty'], 422);
    $stmt = $conn->prepare('UPDATE community_posts SET body_html=? WHERE id=?');
    $stmt->execute([$body, $post_id]);
} elseif ($method === 'DELETE') {
    $stmt = $conn->prepare("UPDATE community_posts SET status='deleted' WHERE id=?");
    $stmt->execute([$post_id]);
} else json_response(['status' => 'error', 'message' => 'Method not allowed'], 405);
json_response(['status' => 'success']);
?>
