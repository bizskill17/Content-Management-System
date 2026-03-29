<?php
// backend/api/get-resources.php
require_once 'config.php';

$type = isset($_GET['type']) ? $_GET['type'] : null;
$slug = isset($_GET['slug']) ? $_GET['slug'] : null;

$allowed_types = ['tool', 'template', 'checklist', 'download'];

try {
    if ($slug) {
        $stmt = $conn->prepare("SELECT * FROM resources WHERE slug = ?");
        $stmt->execute([$slug]);
        $resource = $stmt->fetch();
        echo json_encode(["status" => "success", "data" => $resource]);
    } elseif ($type && in_array($type, $allowed_types)) {
        $stmt = $conn->prepare("SELECT id, title, slug, category, thumbnail, file_url, created_at FROM resources WHERE type = ? ORDER BY created_at DESC");
        $stmt->execute([$type]);
        $resources = $stmt->fetchAll();
        echo json_encode(["status" => "success", "data" => $resources]);
    } else {
        $stmt = $conn->query("SELECT id, title, slug, type, category, thumbnail, file_url, created_at FROM resources ORDER BY created_at DESC");
        $resources = $stmt->fetchAll();
        echo json_encode(["status" => "success", "data" => $resources]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
