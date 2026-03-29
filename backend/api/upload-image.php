<?php
// backend/api/upload-image.php
require_once 'config.php';

// Detect if POST was too large
if ($_SERVER['REQUEST_METHOD'] == 'POST' && empty($_POST) && $_SERVER['CONTENT_LENGTH'] > 0) {
    http_response_code(413);
    echo json_encode([
        "status" => "error", 
        "message" => "POST data too large. Check PHP post_max_size.",
        "content_length" => $_SERVER['CONTENT_LENGTH']
    ]);
    exit();
}

// Support both Form POST (Robust) and raw JSON body
$raw_input = isset($_POST['json_data']) ? $_POST['json_data'] : file_get_contents("php://input");
$input = json_decode($raw_input, true);

if (!$input || !isset($input['image']) || !isset($input['folder'])) {
    http_response_code(400);
    echo json_encode([
        "status" => "error", 
        "message" => "Image data and folder are required. Received " . strlen($raw_input) . " bytes.",
        "json_error" => json_last_error_msg(),
        "post_max_size" => ini_get('post_max_size'),
        "content_length" => $_SERVER['CONTENT_LENGTH'] ?? 'unknown'
    ]);
    exit();
}

$imageData = $input['image'];
$folder = $input['folder'];
$fileName = isset($input['fileName']) ? $input['fileName'] : 'image-' . time() . '.png';

// Clean folder path to prevent directory traversal
$folder = preg_replace('/[^A-Za-z0-9-\/]/', '', $folder);
$targetDir = "../uploads/" . $folder . "/";

if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
}

// Strip data:image/png;base64, or similar
if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
    $imageData = substr($imageData, strpos($imageData, ',') + 1);
    $type = strtolower($type[1]); // png, jpg, etc.
} else {
    echo json_encode(["status" => "error", "message" => "Invalid image format"]);
    exit();
}

$decodedImage = base64_decode($imageData);
if ($decodedImage === false) {
    echo json_encode(["status" => "error", "message" => "Base64 decode failed"]);
    exit();
}

$targetFile = $targetDir . $fileName;

if (file_put_contents($targetFile, $decodedImage)) {
    // Generate full URL
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'];
    $url = $protocol . $host . "/backend/uploads/" . $folder . "/" . $fileName;
    
    echo json_encode(["status" => "success", "url" => $url]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to save image"]);
}
?>
