<?php
// backend/api/config.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Credentials (Hostinger)
$db_host = 'localhost';
$db_user = 'u380752258_user_jhatpatai'; 
$db_pass = '!Office1@'; 
$db_name = 'u380752258_db_jhatpatai'; 

try {
    $conn = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Connection failed: " . $e->getMessage()]);
    exit();
}

// Secret Key for JWT (Change this in production)
$jwt_secret = "JhatPatAI_Super_Secret_Key_2026!";

// Razorpay Credentials (Test Mode)
define('RAZORPAY_KEY_ID', 'rzp_test_SUMm3VJIUVmCUy');
define('RAZORPAY_KEY_SECRET', 'Dx1AxzLg0JicXD7lJj8pswsA');
define('RAZORPAY_PLAN_ID', 'plan_SUMy880MRtXUQ0');

// Helper function for Slug generation
function createSlug($string) {
    return strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $string), '-'));
}
?>
