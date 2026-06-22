<?php
require_once 'community-lib.php';
$id = (int)($_GET['id'] ?? 0);
if (!$id) json_response(['status' => 'error', 'message' => 'Post ID is required'], 422);
$stmt = $conn->prepare("SELECT p.*,u.name author_name,u.role author_role,s.name space_name,s.slug space_slug,s.icon space_icon,
    (SELECT COUNT(*) FROM community_reactions r WHERE r.post_id=p.id) reaction_count
    FROM community_posts p JOIN users u ON u.id=p.user_id JOIN community_spaces s ON s.id=p.space_id WHERE p.id=? AND p.status='published'");
$stmt->execute([$id]);
$post = $stmt->fetch();
if (!$post) json_response(['status' => 'error', 'message' => 'Post not found'], 404);
$user = current_user($conn);
$access = post_access($conn, $id, $user, true);
if (!$access['allowed']) {
    json_response(['status' => 'error', 'reason' => $access['reason'], 'message' => $access['reason'] === 'login_required' ? 'Log in to read this post' : 'Daily post limit reached', 'preview' => community_excerpt($post['body_html']), 'allowance' => $access], 403);
}
$media = $conn->prepare('SELECT id,media_type,url,original_name,mime_type,size_bytes,sort_order FROM community_media WHERE post_id=? ORDER BY sort_order,id');
$media->execute([$id]);
$comments = $conn->prepare("SELECT c.id,c.parent_id,c.user_id,c.body_html,c.created_at,c.updated_at,u.name author_name,u.role author_role FROM community_comments c JOIN users u ON u.id=c.user_id WHERE c.post_id=? AND c.status='published' ORDER BY c.created_at,c.id");
$comments->execute([$id]);
$post['media'] = $media->fetchAll();
$post['comments'] = $comments->fetchAll();
$post['viewer_liked'] = false;
if ($user) {
    $liked = $conn->prepare('SELECT 1 FROM community_reactions WHERE post_id=? AND user_id=?');
    $liked->execute([$id, $user['id']]);
    $post['viewer_liked'] = (bool)$liked->fetchColumn();
}
$post['allowance'] = allowance_summary($conn, $user);
json_response(['status' => 'success', 'data' => $post]);
?>
