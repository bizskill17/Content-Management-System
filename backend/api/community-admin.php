<?php
require_once 'community-lib.php';
$method = $_SERVER['REQUEST_METHOD'];
$admin = require_admin($conn, $method === 'GET' ? false : true);
if ($method === 'GET') {
    $settings = $conn->query('SELECT tier,access_mode,post_limit,enabled,updated_at FROM feed_access_settings ORDER BY FIELD(tier,\'guest\',\'free\',\'paid\')')->fetchAll();
    $posts = $conn->query("SELECT p.id,p.status,p.is_pinned,p.comments_locked,p.created_at,LEFT(p.body_html,180) excerpt,u.name author_name,s.name space_name FROM community_posts p JOIN users u ON u.id=p.user_id JOIN community_spaces s ON s.id=p.space_id ORDER BY p.created_at DESC LIMIT 100")->fetchAll();
    foreach ($posts as &$post) $post['excerpt'] = community_excerpt($post['excerpt']);
    json_response(['status' => 'success', 'settings' => $settings, 'posts' => $posts]);
}
$data = json_input();
if ($method === 'PUT' && !empty($data['settings']) && is_array($data['settings'])) {
    $allowed_modes = ['fixed_latest','daily_unique','unlimited'];
    $stmt = $conn->prepare('UPDATE feed_access_settings SET access_mode=?,post_limit=?,enabled=? WHERE tier=?');
    foreach ($data['settings'] as $item) {
        if (!in_array($item['tier'] ?? '', ['guest','free','paid'], true) || !in_array($item['access_mode'] ?? '', $allowed_modes, true)) json_response(['status' => 'error', 'message' => 'Invalid access setting'], 422);
        if ($item['tier'] === 'guest' && $item['access_mode'] === 'daily_unique') json_response(['status' => 'error', 'message' => 'Guest access cannot use daily tracking'], 422);
        $limit = $item['access_mode'] === 'unlimited' ? null : filter_var($item['post_limit'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
        if ($item['access_mode'] !== 'unlimited' && $limit === false) json_response(['status' => 'error', 'message' => 'Limits must be non-negative integers'], 422);
        $stmt->execute([$item['access_mode'],$limit,!empty($item['enabled']) ? 1 : 0,$item['tier']]);
    }
    json_response(['status' => 'success']);
}
if ($method === 'POST') {
    $id = (int)($data['post_id'] ?? 0); $action = $data['action'] ?? '';
    $actions = [
        'hide' => "status='hidden'", 'restore' => "status='published'",
        'pin' => 'is_pinned=1', 'unpin' => 'is_pinned=0', 'lock' => 'comments_locked=1', 'unlock' => 'comments_locked=0',
    ];
    if ($id && $action === 'delete') {
        $conn->prepare('DELETE FROM community_posts WHERE id=?')->execute([$id]);
        $dir = dirname(__DIR__) . '/uploads/community/' . $id;
        if (is_dir($dir)) {
            foreach (glob($dir . '/*') ?: [] as $file) if (is_file($file)) @unlink($file);
            @rmdir($dir);
        }
        json_response(['status' => 'success']);
    }
    if (!$id || !isset($actions[$action])) json_response(['status' => 'error', 'message' => 'Invalid moderation action'], 422);
    $conn->prepare('UPDATE community_posts SET ' . $actions[$action] . ' WHERE id=?')->execute([$id]);
    json_response(['status' => 'success']);
}
json_response(['status' => 'error', 'message' => 'Method not allowed'], 405);
?>
