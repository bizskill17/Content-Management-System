<?php
require_once 'config.php';

$default_menu_items = [
    ['key' => 'home', 'label' => 'Home', 'href' => '/', 'sort_order' => 10],
    ['key' => 'courses', 'label' => 'Courses', 'href' => '/courses', 'sort_order' => 20],
    ['key' => 'community', 'label' => 'Feed', 'href' => '/community/', 'sort_order' => 30],
    ['key' => 'tools', 'label' => 'Tools', 'href' => '/tools', 'sort_order' => 40],
    ['key' => 'templates', 'label' => 'Templates', 'href' => '/templates', 'sort_order' => 50],
    ['key' => 'checklists', 'label' => 'Checklists', 'href' => '/checklists', 'sort_order' => 60],
    ['key' => 'downloads', 'label' => 'Downloads', 'href' => '/downloads', 'sort_order' => 70],
    ['key' => 'blog', 'label' => 'Blog', 'href' => '/blog', 'sort_order' => 80],
    ['key' => 'pricing', 'label' => 'Pricing', 'href' => '/pricing', 'sort_order' => 90],
];

function ensure_menu_items(PDO $conn, array $defaults): void {
    $conn->exec("CREATE TABLE IF NOT EXISTS nav_menu_items (
        item_key VARCHAR(80) PRIMARY KEY,
        label VARCHAR(120) NOT NULL,
        href VARCHAR(255) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_visible TINYINT(1) NOT NULL DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $stmt = $conn->prepare("INSERT INTO nav_menu_items (item_key, label, href, sort_order, is_visible)
        VALUES (?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE label=VALUES(label), href=VALUES(href), sort_order=VALUES(sort_order)");
    foreach ($defaults as $item) {
        $stmt->execute([$item['key'], $item['label'], $item['href'], $item['sort_order']]);
    }
}

ensure_menu_items($conn, $default_menu_items);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $include_all = isset($_GET['all']);
    if ($include_all) require_admin($conn, false);
    $where = $include_all ? '' : 'WHERE is_visible = 1';
    $items = $conn->query("SELECT item_key, label, href, sort_order, is_visible FROM nav_menu_items {$where} ORDER BY sort_order ASC")->fetchAll();
    json_response(['status' => 'success', 'data' => $items]);
}

if ($method === 'PUT') {
    require_admin($conn);
    $data = json_input();
    if (empty($data['items']) || !is_array($data['items'])) {
        json_response(['status' => 'error', 'message' => 'Menu items are required'], 422);
    }
    $allowed = array_column($default_menu_items, 'key');
    $stmt = $conn->prepare('UPDATE nav_menu_items SET is_visible = ? WHERE item_key = ?');
    foreach ($data['items'] as $item) {
        $key = (string)($item['item_key'] ?? '');
        if (!in_array($key, $allowed, true)) json_response(['status' => 'error', 'message' => 'Invalid menu item'], 422);
        $stmt->execute([!empty($item['is_visible']) ? 1 : 0, $key]);
    }
    json_response(['status' => 'success']);
}

json_response(['status' => 'error', 'message' => 'Method not allowed'], 405);
?>
