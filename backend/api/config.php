<?php
declare(strict_types=1);

date_default_timezone_set('Asia/Kolkata');

$frontend_origin = getenv('FRONTEND_ORIGIN') ?: 'http://localhost:3000';
$request_origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($request_origin === $frontend_origin) {
    header("Access-Control-Allow-Origin: {$frontend_origin}");
    header('Access-Control-Allow-Credentials: true');
}
header('Vary: Origin');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_user = getenv('DB_USER') ?: '';
$db_pass = getenv('DB_PASS') ?: '';
$db_name = getenv('DB_NAME') ?: '';

try {
    $conn = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

define('RAZORPAY_KEY_ID', getenv('RAZORPAY_KEY_ID') ?: '');
define('RAZORPAY_KEY_SECRET', getenv('RAZORPAY_KEY_SECRET') ?: '');
define('RAZORPAY_PLAN_ID', getenv('RAZORPAY_PLAN_ID') ?: '');
define('RAZORPAY_WEBHOOK_SECRET', getenv('RAZORPAY_WEBHOOK_SECRET') ?: '');
define('SESSION_COOKIE', 'jhatpatai_session');
define('SESSION_TTL', 60 * 60 * 24 * 30);

function json_response(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function json_input(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function createSlug($value): string {
    return strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', (string)$value), '-'));
}

function clean_community_html(string $html): string {
    $html = trim(strip_tags($html, '<p><br><strong><b><em><i><u><ul><ol><li><blockquote><a><code><pre>'));
    $html = preg_replace('/\s+on\w+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $html);
    $html = preg_replace_callback('/<a\s+([^>]*?)href\s*=\s*(["\'])(.*?)\2([^>]*)>/i', function ($m) {
        $url = filter_var(html_entity_decode($m[3]), FILTER_VALIDATE_URL);
        if (!$url || !in_array(parse_url($url, PHP_URL_SCHEME), ['http', 'https'], true)) return '<a>';
        return '<a href="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '" target="_blank" rel="noopener noreferrer">';
    }, $html);
    return $html;
}

function community_excerpt(string $html, int $length = 220): string {
    $text = trim(preg_replace('/\s+/', ' ', strip_tags($html)));
    return mb_strlen($text) > $length ? mb_substr($text, 0, $length) . '…' : $text;
}

function set_session_cookie(string $token, int $expires): void {
    setcookie(SESSION_COOKIE, $token, [
        'expires' => $expires,
        'path' => '/',
        'secure' => (getenv('COOKIE_SECURE') ?: '1') !== '0',
        'httponly' => true,
        'samesite' => getenv('COOKIE_SAMESITE') ?: 'None',
    ]);
}

function issue_session(PDO $conn, int $user_id): string {
    $token = bin2hex(random_bytes(32));
    $csrf = bin2hex(random_bytes(24));
    $expires = time() + SESSION_TTL;
    $stmt = $conn->prepare('INSERT INTO auth_sessions (user_id, token_hash, csrf_hash, expires_at) VALUES (?, ?, ?, ?)');
    $stmt->execute([$user_id, hash('sha256', $token), hash('sha256', $csrf), date('Y-m-d H:i:s', $expires)]);
    set_session_cookie($token, $expires);
    return $csrf;
}

function current_user(PDO $conn): ?array {
    $token = $_COOKIE[SESSION_COOKIE] ?? '';
    if (!$token) return null;
    $stmt = $conn->prepare("SELECT u.id, u.name, u.email, u.mobile, u.role,
        CASE WHEN u.role = 'admin' THEN 'active'
             WHEN s.status = 'active' AND (s.expiry_date IS NULL OR s.expiry_date > NOW()) THEN 'active'
             ELSE 'inactive' END AS subscription_status,
        s.plan AS subscription_plan, a.csrf_hash
        FROM auth_sessions a JOIN users u ON u.id = a.user_id
        LEFT JOIN subscriptions s ON s.user_id = u.id
        WHERE a.token_hash = ? AND a.expires_at > NOW()
        ORDER BY s.expiry_date DESC LIMIT 1");
    $stmt->execute([hash('sha256', $token)]);
    return $stmt->fetch() ?: null;
}

function require_user(PDO $conn, bool $csrf = true): array {
    $user = current_user($conn);
    if (!$user) json_response(['status' => 'error', 'reason' => 'login_required', 'message' => 'Please log in'], 401);
    if ($csrf && !hash_equals($user['csrf_hash'], hash('sha256', $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) {
        json_response(['status' => 'error', 'reason' => 'csrf_failed', 'message' => 'Invalid CSRF token'], 403);
    }
    return $user;
}

function require_admin(PDO $conn, bool $csrf = true): array {
    $user = require_user($conn, $csrf);
    if ($user['role'] !== 'admin') json_response(['status' => 'error', 'message' => 'Admin access required'], 403);
    return $user;
}

function public_user(array $user): array {
    unset($user['csrf_hash']);
    return $user;
}
?>
