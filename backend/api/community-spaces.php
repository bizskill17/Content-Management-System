<?php
require_once 'community-lib.php';
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    $viewer = current_user($conn);
    $include_archived = isset($_GET['all']) && $viewer && $viewer['role'] === 'admin';
    $sql = "SELECT s.*, u.name AS creator_name, (SELECT COUNT(*) FROM community_posts p WHERE p.space_id=s.id AND p.status='published') AS post_count FROM community_spaces s JOIN users u ON u.id=s.created_by";
    if (!$include_archived) $sql .= " WHERE s.status='active'";
    $sql .= ' ORDER BY s.name';
    json_response(['status' => 'success', 'data' => $conn->query($sql)->fetchAll()]);
}
$admin = require_admin($conn);
$data = json_input();
if ($method === 'POST') {
    if (empty($data['name'])) json_response(['status' => 'error', 'message' => 'Space name is required'], 422);
    $slug = createSlug($data['slug'] ?? $data['name']);
    try {
        $stmt = $conn->prepare('INSERT INTO community_spaces (name, slug, description, icon, cover_url, created_by) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([trim($data['name']), $slug, trim($data['description'] ?? ''), trim($data['icon'] ?? ''), trim($data['cover_url'] ?? ''), $admin['id']]);
        json_response(['status' => 'success', 'id' => (int)$conn->lastInsertId()], 201);
    } catch (PDOException $e) { json_response(['status' => 'error', 'message' => 'Space slug must be unique'], 409); }
}
if (!in_array($method, ['PATCH', 'DELETE'], true) || empty($data['id'])) json_response(['status' => 'error', 'message' => 'Invalid request'], 422);
if ($method === 'DELETE') {
    $stmt = $conn->prepare("UPDATE community_spaces SET status='archived' WHERE id=?");
    $stmt->execute([(int)$data['id']]);
} else {
    $stmt = $conn->prepare('UPDATE community_spaces SET name=?, slug=?, description=?, icon=?, cover_url=?, status=? WHERE id=?');
    $stmt->execute([trim($data['name']), createSlug($data['slug'] ?? $data['name']), trim($data['description'] ?? ''), trim($data['icon'] ?? ''), trim($data['cover_url'] ?? ''), $data['status'] === 'archived' ? 'archived' : 'active', (int)$data['id']]);
}
json_response(['status' => 'success']);
?>
