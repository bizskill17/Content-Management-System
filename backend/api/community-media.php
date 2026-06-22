<?php
require_once 'community-lib.php';
$user = require_user($conn);
$post_id = (int)($_POST['post_id'] ?? 0);
$post = post_owner_or_admin($conn, $post_id, $user);
if (!isset($_FILES['files'])) json_response(['status' => 'error', 'message' => 'No files uploaded'], 422);

$names = (array)$_FILES['files']['name'];
$tmp_names = (array)$_FILES['files']['tmp_name'];
$sizes = (array)$_FILES['files']['size'];
$errors = (array)$_FILES['files']['error'];
if (count($names) > 6 || array_sum($sizes) > 25 * 1024 * 1024) json_response(['status' => 'error', 'message' => 'Maximum 6 files and 25 MB per upload'], 422);
$existing = $conn->prepare("SELECT media_type,COUNT(*) count,SUM(size_bytes) size FROM community_media WHERE post_id=? AND media_type IN ('image','document') GROUP BY media_type");
$existing->execute([$post_id]);
$counts = ['image' => 0, 'document' => 0]; $total_size = 0;
foreach ($existing->fetchAll() as $row) { $counts[$row['media_type']] = (int)$row['count']; $total_size += (int)$row['size']; }
$allowed = [
    'image/jpeg' => ['image','jpg'], 'image/png' => ['image','png'], 'image/webp' => ['image','webp'], 'image/gif' => ['image','gif'],
    'application/pdf' => ['document','pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => ['document','docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => ['document','xlsx'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation' => ['document','pptx'],
];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$validated = [];
foreach ($names as $i => $original) {
    if (($errors[$i] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) json_response(['status' => 'error', 'message' => 'A file could not be uploaded'], 422);
    $mime = $finfo->file($tmp_names[$i]);
    if (!isset($allowed[$mime])) json_response(['status' => 'error', 'message' => 'Unsupported file type'], 422);
    [$type,$ext] = $allowed[$mime];
    $counts[$type]++;
    $total_size += (int)$sizes[$i];
    if ($counts['image'] > 4 || $counts['document'] > 2 || $total_size > 25 * 1024 * 1024) json_response(['status' => 'error', 'message' => 'Post media limit exceeded'], 422);
    $validated[] = ['index' => $i, 'name' => basename($original), 'mime' => $mime, 'type' => $type, 'ext' => $ext, 'size' => (int)$sizes[$i]];
}
$dir_relative = 'uploads/community/' . $post_id;
$dir = dirname(__DIR__) . '/' . $dir_relative;
if (!is_dir($dir) && !mkdir($dir, 0755, true)) json_response(['status' => 'error', 'message' => 'Upload directory unavailable'], 500);
$insert = $conn->prepare('INSERT INTO community_media (post_id,media_type,url,original_name,mime_type,size_bytes,sort_order) VALUES (?,?,?,?,?,?,?)');
$saved = []; $written = [];
try {
    $conn->beginTransaction();
    foreach ($validated as $order => $file) {
        $filename = bin2hex(random_bytes(16)) . '.' . $file['ext'];
        $path = $dir . '/' . $filename;
        if (!move_uploaded_file($tmp_names[$file['index']], $path)) throw new RuntimeException('Could not save upload');
        $written[] = $path;
        $url = media_public_url($dir_relative . '/' . $filename);
        $insert->execute([$post_id,$file['type'],$url,mb_substr($file['name'],0,255),$file['mime'],$file['size'],$order]);
        $saved[] = ['id' => (int)$conn->lastInsertId(), 'media_type' => $file['type'], 'url' => $url, 'original_name' => $file['name']];
    }
    $conn->commit();
} catch (Throwable $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    foreach ($written as $path) if (is_file($path)) @unlink($path);
    json_response(['status' => 'error', 'message' => 'Could not save uploads'], 500);
}
json_response(['status' => 'success', 'data' => $saved], 201);
?>
