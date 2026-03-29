<?php
// backend/api/save-content.php
require_once 'config.php';

// Support both Form POST (Robust) and raw JSON body
$raw_data = isset($_POST['json_data']) ? $_POST['json_data'] : file_get_contents("php://input");
$input = json_decode($raw_data, true);

if (!$input) {
    http_response_code(400);
    echo json_encode([
        "status" => "error", 
        "message" => "Invalid payload. Received " . strlen($raw_data) . " bytes.", 
        "json_error" => json_last_error_msg(),
        "post_max_size" => ini_get('post_max_size'),
        "content_length" => $_SERVER['CONTENT_LENGTH'] ?? 'unknown',
        "method" => $_SERVER['REQUEST_METHOD']
    ]);
    exit();
}

$type = $input['type']; // course, lesson, blog, tool, template, checklist, download
$slug = $input['slug'];
$title = $input['title'];
$html_content = isset($input['html_content']) ? $input['html_content'] : '';
$category = isset($input['category']) ? $input['category'] : 'General';
$access_type = isset($input['access_type']) ? $input['access_type'] : 'free';
$order_no = isset($input['order_no']) ? (int)$input['order_no'] : 0;
$course_slug = isset($input['course_slug']) ? $input['course_slug'] : null;
$section_name = isset($input['section_name']) ? $input['section_name'] : null;
$thumbnail = isset($input['thumbnail']) ? $input['thumbnail'] : null;
$action = isset($input['status']) ? $input['status'] : 'sync';

function deleteDirectory($dir) {
    if (!file_exists($dir)) return true;
    if (!is_dir($dir)) return unlink($dir);
    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') continue;
        if (!deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) return false;
    }
    return rmdir($dir);
}

function handleThumbnail($url, $type, $slug) {
    if (empty($url) || !preg_match('/^https?:\/\//', $url)) return $url;

    $dir = "../uploads/$type/$slug";
    if (!file_exists($dir)) mkdir($dir, 0777, true);

    $ext = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'jpg';
    $path = "$dir/thumb.$ext";
    
    // Download and Save
    $content = @file_get_contents($url);
    if ($content) {
        file_put_contents($path, $content);
        return "uploads/$type/$slug/thumb.$ext"; // Return relative path for DB
    }
    return $url; // Fallback
}

try {
    if ($action === 'delete') {
        if ($type === 'course') {
            // Find all lessons in this course to delete their images
            $stmt_lessons = $conn->prepare("SELECT l.slug FROM lessons l JOIN sections s ON l.section_id = s.id JOIN courses c ON s.course_id = c.id WHERE c.slug = ?");
            $stmt_lessons->execute([$slug]);
            $lessons = $stmt_lessons->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($lessons as $lesson) {
                deleteDirectory("../uploads/lesson/" . $lesson['slug']);
            }
            // Also delete course thumbnail folder if it exists
            deleteDirectory("../uploads/course/" . $slug);

            $stmt = $conn->prepare("DELETE FROM courses WHERE slug = ?");
            $stmt->execute([$slug]);
        } 
        elseif ($type === 'lesson') {
            deleteDirectory("../uploads/lesson/" . $slug);
            $stmt = $conn->prepare("DELETE FROM lessons WHERE slug = ?");
            $stmt->execute([$slug]);
        } 
        elseif ($type === 'blog') {
            deleteDirectory("../uploads/blog/" . $slug);
            $stmt = $conn->prepare("DELETE FROM blogs WHERE slug = ?");
            $stmt->execute([$slug]);
        } 
        else if (in_array($type, ['tool', 'template', 'checklist', 'download'])) {
            deleteDirectory("../uploads/" . $type . "/" . $slug);
            $stmt = $conn->prepare("DELETE FROM resources WHERE slug = ? AND type = ?");
            $stmt->execute([$slug, $type]);
        }
        echo json_encode(["status" => "success", "message" => "Item and associated media deleted successfully"]);
        exit();
    }

    if ($type === 'course') {
        $thumbnail = handleThumbnail($thumbnail, 'course', $slug);
        $stmt = $conn->prepare("INSERT INTO courses (name, slug, category, thumbnail, description) 
                               VALUES (?, ?, ?, ?, ?) 
                               ON DUPLICATE KEY UPDATE name=?, category=?, thumbnail=?, description=?");
        $stmt->execute([$title, $slug, $category, $thumbnail, $html_content, $title, $category, $thumbnail, $html_content]);
    } 
    elseif ($type === 'lesson') {
        $thumbnail = handleThumbnail($thumbnail, 'lesson', $slug);
        // Find course_id
        $stmt_course = $conn->prepare("SELECT id FROM courses WHERE slug = ?");
        $stmt_course->execute([$course_slug]);
        $course = $stmt_course->fetch();
        
        if (!$course) {
            echo json_encode(["status" => "error", "message" => "Course not found: $course_slug"]);
            exit();
        }
        
        // Find or Create section
        $stmt_section = $conn->prepare("SELECT id FROM sections WHERE course_id = ? AND name = ?");
        $stmt_section->execute([$course['id'], $section_name]);
        $section = $stmt_section->fetch();
        
        if (!$section) {
            $stmt_new_section = $conn->prepare("INSERT INTO sections (course_id, name, order_no) VALUES (?, ?, ?)");
            $stmt_new_section->execute([$course['id'], $section_name, 0]);
            $section_id = $conn->lastInsertId();
        } else {
            $section_id = $section['id'];
        }
        
        $stmt = $conn->prepare("INSERT INTO lessons (section_id, title, slug, thumbnail, html_content, access_type, order_no) 
                               VALUES (?, ?, ?, ?, ?, ?, ?) 
                               ON DUPLICATE KEY UPDATE section_id=?, title=?, thumbnail=?, html_content=?, access_type=?, order_no=?");
        $stmt->execute([$section_id, $title, $slug, $thumbnail, $html_content, $access_type, $order_no, $section_id, $title, $thumbnail, $html_content, $access_type, $order_no]);
    } 
    elseif ($type === 'blog') {
        $thumbnail = handleThumbnail($thumbnail, 'blog', $slug);
        $stmt = $conn->prepare("INSERT INTO blogs (title, slug, thumbnail, html_content) 
                               VALUES (?, ?, ?, ?) 
                               ON DUPLICATE KEY UPDATE title=?, thumbnail=?, html_content=?");
        $stmt->execute([$title, $slug, $thumbnail, $html_content, $title, $thumbnail, $html_content]);
    } 
    else if (in_array($type, ['tool', 'template', 'checklist', 'download'])) {
        $thumbnail = handleThumbnail($thumbnail, $type, $slug);
        $stmt = $conn->prepare("INSERT INTO resources (title, slug, type, category, thumbnail, html_content) 
                               VALUES (?, ?, ?, ?, ?, ?) 
                               ON DUPLICATE KEY UPDATE title=?, category=?, thumbnail=?, html_content=?");
        $stmt->execute([$title, $slug, $type, $category, $thumbnail, $html_content, $title, $category, $thumbnail, $html_content]);
    }

    echo json_encode(["status" => "success", "message" => "Content updated successfully"]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
