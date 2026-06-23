<?php
require_once 'config.php';

$default_footer_items = [
    ['key' => 'learn_courses', 'section' => 'Learn', 'label' => 'All Courses', 'href' => '/courses', 'sort_order' => 10],
    ['key' => 'learn_tools', 'section' => 'Learn', 'label' => 'AI Tools', 'href' => '/tools', 'sort_order' => 20],
    ['key' => 'learn_templates', 'section' => 'Learn', 'label' => 'Templates', 'href' => '/templates', 'sort_order' => 30],
    ['key' => 'learn_checklists', 'section' => 'Learn', 'label' => 'Checklists', 'href' => '/checklists', 'sort_order' => 40],
    ['key' => 'learn_downloads', 'section' => 'Learn', 'label' => 'Downloads', 'href' => '/downloads', 'sort_order' => 50],
    ['key' => 'company_blog', 'section' => 'Company', 'label' => 'Blog', 'href' => '/blog', 'sort_order' => 10],
    ['key' => 'company_about', 'section' => 'Company', 'label' => 'About Us', 'href' => '/about', 'sort_order' => 20],
    ['key' => 'company_contact', 'section' => 'Company', 'label' => 'Contact', 'href' => '/contact', 'sort_order' => 30],
    ['key' => 'account_login', 'section' => 'Account', 'label' => 'Login', 'href' => '/login', 'sort_order' => 10],
    ['key' => 'account_register', 'section' => 'Account', 'label' => 'Sign Up Free', 'href' => '/register', 'sort_order' => 20],
    ['key' => 'account_dashboard', 'section' => 'Account', 'label' => 'My Dashboard', 'href' => '/dashboard', 'sort_order' => 30],
];

function ensure_footer_items(PDO $conn, array $defaults): void {
    $conn->exec("CREATE TABLE IF NOT EXISTS footer_menu_items (
        item_key VARCHAR(80) PRIMARY KEY,
        section_label VARCHAR(120) NOT NULL,
        label VARCHAR(120) NOT NULL,
        href VARCHAR(255) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_visible TINYINT(1) NOT NULL DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $stmt = $conn->prepare("INSERT INTO footer_menu_items (item_key, section_label, label, href, sort_order, is_visible)
        VALUES (?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE section_label=VALUES(section_label), label=VALUES(label), href=VALUES(href), sort_order=VALUES(sort_order)");
    foreach ($defaults as $item) {
        $stmt->execute([$item['key'], $item['section'], $item['label'], $item['href'], $item['sort_order']]);
    }
}

ensure_footer_items($conn, $default_footer_items);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $include_all = isset($_GET['all']);
    if ($include_all) require_admin($conn, false);
    $where = $include_all ? '' : 'WHERE is_visible = 1';
    $items = $conn->query("SELECT item_key, section_label, label, href, sort_order, is_visible FROM footer_menu_items {$where} ORDER BY section_label ASC, sort_order ASC")->fetchAll();
    json_response(['status' => 'success', 'data' => $items]);
}

if ($method === 'PUT') {
    require_admin($conn);
    $data = json_input();
    if (empty($data['items']) || !is_array($data['items'])) {
        json_response(['status' => 'error', 'message' => 'Footer items are required'], 422);
    }
    $allowed = array_column($default_footer_items, 'key');
    $stmt = $conn->prepare('UPDATE footer_menu_items SET is_visible = ? WHERE item_key = ?');
    foreach ($data['items'] as $item) {
        $key = (string)($item['item_key'] ?? '');
        if (!in_array($key, $allowed, true)) json_response(['status' => 'error', 'message' => 'Invalid footer item'], 422);
        $stmt->execute([!empty($item['is_visible']) ? 1 : 0, $key]);
    }
    json_response(['status' => 'success']);
}

json_response(['status' => 'error', 'message' => 'Method not allowed'], 405);
?>
