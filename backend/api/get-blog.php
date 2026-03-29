<?php
// backend/api/get-blog.php
require_once 'config.php';

$slug = isset($_GET['slug']) ? $_GET['slug'] : null;

try {
    if ($slug) {
        $stmt = $conn->prepare("SELECT * FROM blogs WHERE slug = ?");
        $stmt->execute([$slug]);
        $blog = $stmt->fetch();
        echo json_encode(["status" => "success", "data" => $blog]);
    } else {
        $stmt = $conn->query("SELECT id, title, slug, thumbnail, meta_description, created_at FROM blogs ORDER BY created_at DESC");
        $blogs = $stmt->fetchAll();
        echo json_encode(["status" => "success", "data" => $blogs]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
