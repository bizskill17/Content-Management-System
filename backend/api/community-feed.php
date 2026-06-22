<?php
require_once 'community-lib.php';
$user = current_user($conn);
$sort = ($_GET['sort'] ?? 'latest') === 'popular' ? 'popular' : 'latest';
$limit = min(20, max(1, (int)($_GET['limit'] ?? 10)));
$cursor = $_GET['cursor'] ?? '';
$decoded = $cursor ? json_decode(base64_decode($cursor, true) ?: '', true) : null;
$offset = max(0, (int)($decoded['offset'] ?? 0));
$space = trim($_GET['space'] ?? '');
$where = "p.status='published' AND s.status='active'";
$params = [];
if ($space) { $where .= ' AND s.slug=?'; $params[] = $space; }
$order = $sort === 'popular'
    ? 'p.is_pinned DESC, (reaction_count + comment_count * 2) DESC, p.created_at DESC, p.id DESC'
    : 'p.is_pinned DESC, p.created_at DESC, p.id DESC';
$sql = "SELECT p.id,p.user_id,p.space_id,p.body_html,p.is_pinned,p.comments_locked,p.created_at,p.updated_at,
    u.name AS author_name,u.role AS author_role,s.name AS space_name,s.slug AS space_slug,s.icon AS space_icon,
    (SELECT COUNT(*) FROM community_reactions r WHERE r.post_id=p.id) reaction_count,
    (SELECT COUNT(*) FROM community_comments c WHERE c.post_id=p.id AND c.status='published') comment_count,
    (SELECT COUNT(*) FROM community_media m WHERE m.post_id=p.id) media_count
    FROM community_posts p JOIN users u ON u.id=p.user_id JOIN community_spaces s ON s.id=p.space_id
    WHERE {$where} ORDER BY {$order} LIMIT ? OFFSET ?";
$stmt = $conn->prepare($sql);
$index = 1;
foreach ($params as $value) $stmt->bindValue($index++, $value);
$stmt->bindValue($index++, $limit + 1, PDO::PARAM_INT);
$stmt->bindValue($index, $offset, PDO::PARAM_INT);
$stmt->execute();
$rows = $stmt->fetchAll();
$has_more = count($rows) > $limit;
$rows = array_slice($rows, 0, $limit);
foreach ($rows as &$row) {
    $access = post_access($conn, (int)$row['id'], $user, false);
    $row['excerpt'] = community_excerpt($row['body_html']);
    $row['is_unlocked'] = !empty($access['unlocked']);
    $row['can_open'] = (bool)$access['allowed'];
    $row['lock_reason'] = $access['reason'];
    $row['viewer_liked'] = false;
    unset($row['body_html']);
    if ($user) {
        $liked = $conn->prepare('SELECT 1 FROM community_reactions WHERE post_id=? AND user_id=?');
        $liked->execute([$row['id'], $user['id']]);
        $row['viewer_liked'] = (bool)$liked->fetchColumn();
    }
}
json_response(['status' => 'success', 'data' => $rows, 'allowance' => allowance_summary($conn, $user), 'next_cursor' => $has_more ? base64_encode(json_encode(['offset' => $offset + $limit])) : null]);
?>
