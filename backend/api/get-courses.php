<?php
// backend/api/get-courses.php
require_once 'config.php';

try {
    $stmt = $conn->query("SELECT * FROM courses ORDER BY created_at DESC");
    $courses = $stmt->fetchAll();
    echo json_encode(["status" => "success", "data" => $courses]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
