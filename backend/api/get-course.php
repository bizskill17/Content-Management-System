<?php
// backend/api/get-course.php
require_once 'config.php';

$slug = isset($_GET['slug']) ? $_GET['slug'] : null;

if (!$slug) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Course slug is required"]);
    exit();
}

try {
    $stmt = $conn->prepare("SELECT * FROM courses WHERE slug = ?");
    $stmt->execute([$slug]);
    $course = $stmt->fetch();
    
    if (!$course) {
        echo json_encode(["status" => "error", "message" => "Course not found"]);
        exit();
    }
    
    // Get sections and lessons
    $stmt_sections = $conn->prepare("SELECT * FROM sections WHERE course_id = ? ORDER BY name ASC, id ASC");
    $stmt_sections->execute([$course['id']]);
    $sections = $stmt_sections->fetchAll();
    
    foreach ($sections as &$section) {
        $stmt_lessons = $conn->prepare("SELECT id, title, slug, access_type, order_no FROM lessons WHERE section_id = ? ORDER BY title ASC, id ASC");
        $stmt_lessons->execute([$section['id']]);
        $section['lessons'] = $stmt_lessons->fetchAll();
    }
    
    $course['sections'] = $sections;
    echo json_encode(["status" => "success", "data" => $course]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
