<?php
// backend/api/get-lesson.php
require_once 'config.php';

$slug = isset($_GET['slug']) ? $_GET['slug'] : null;

if (!$slug) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Slug is required"]);
    exit();
}

try {
    // 1. Get current lesson and course info
    $stmt = $conn->prepare("
        SELECT l.*, c.slug AS course_slug, c.name AS course_name 
        FROM lessons l
        JOIN sections s ON l.section_id = s.id
        JOIN courses c ON s.course_id = c.id
        WHERE l.slug = ?
    ");
    $stmt->execute([$slug]);
    $lesson = $stmt->fetch();
    
    if (!$lesson) {
        echo json_encode(["status" => "error", "message" => "Lesson not found"]);
        exit();
    }

    // 2. Get all lessons in this course ordered correctly to find prev/next
    $stmt_nav = $conn->prepare("
        SELECT l.slug, l.title 
        FROM lessons l
        JOIN sections s ON l.section_id = s.id
        JOIN courses c ON s.course_id = c.id
        WHERE c.slug = ?
        ORDER BY s.order_no ASC, l.order_no ASC
    ");
    $stmt_nav->execute([$lesson['course_slug']]);
    $all_lessons = $stmt_nav->fetchAll(PDO::FETCH_ASSOC);

    $prev = null;
    $next = null;
    $count = count($all_lessons);

    for ($i = 0; $i < $count; $i++) {
        if ($all_lessons[$i]['slug'] === $slug) {
            if ($i > 0) $prev = $all_lessons[$i-1];
            if ($i < $count - 1) $next = $all_lessons[$i+1];
            break;
        }
    }

    echo json_encode([
        "status" => "success", 
        "data" => $lesson,
        "prev" => $prev,
        "next" => $next
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
