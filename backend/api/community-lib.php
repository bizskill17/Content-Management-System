<?php
require_once 'config.php';

function community_tier(?array $user): string {
    if (!$user) return 'guest';
    if ($user['role'] === 'admin' || $user['subscription_status'] === 'active') return 'paid';
    return 'free';
}

function access_setting(PDO $conn, string $tier): array {
    if ($tier === 'paid') {
        $stmt = $conn->prepare('SELECT tier, access_mode, post_limit, enabled FROM feed_access_settings WHERE tier = ?');
        $stmt->execute(['paid']);
    } else {
        $stmt = $conn->prepare('SELECT tier, access_mode, post_limit, enabled FROM feed_access_settings WHERE tier = ?');
        $stmt->execute([$tier]);
    }
    return $stmt->fetch() ?: ['tier' => $tier, 'access_mode' => $tier === 'paid' ? 'unlimited' : 'fixed_latest', 'post_limit' => $tier === 'guest' ? 5 : 20, 'enabled' => 1];
}

function allowance_summary(PDO $conn, ?array $user): array {
    if ($user && $user['role'] === 'admin') return ['tier' => 'admin', 'mode' => 'unlimited', 'limit' => null, 'used' => 0, 'remaining' => null, 'resets_at' => null];
    $tier = community_tier($user);
    $setting = access_setting($conn, $tier);
    $used = 0;
    if ($user && $setting['access_mode'] === 'daily_unique') {
        $stmt = $conn->prepare('SELECT COUNT(*) FROM feed_post_views WHERE user_id = ? AND access_date = CURDATE()');
        $stmt->execute([$user['id']]);
        $used = (int)$stmt->fetchColumn();
    }
    $limit = $setting['post_limit'] === null ? null : (int)$setting['post_limit'];
    return [
        'tier' => $tier,
        'mode' => $setting['enabled'] ? $setting['access_mode'] : 'unlimited',
        'limit' => $limit,
        'used' => $used,
        'remaining' => $limit === null ? null : max(0, $limit - $used),
        'resets_at' => $setting['access_mode'] === 'daily_unique' ? date(DATE_ATOM, strtotime('tomorrow midnight')) : null,
    ];
}

function guest_post_is_open(PDO $conn, int $post_id, int $limit): bool {
    if ($limit <= 0) return false;
    $stmt = $conn->prepare('SELECT 1 FROM (SELECT id FROM community_posts WHERE status = \'published\' ORDER BY created_at DESC, id DESC LIMIT ?) newest WHERE id = ?');
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->bindValue(2, $post_id, PDO::PARAM_INT);
    $stmt->execute();
    return (bool)$stmt->fetchColumn();
}

function post_access(PDO $conn, int $post_id, ?array $user, bool $consume = false): array {
    if ($user && $user['role'] === 'admin') return ['allowed' => true, 'unlocked' => true, 'reason' => null] + allowance_summary($conn, $user);
    $summary = allowance_summary($conn, $user);
    if ($summary['mode'] === 'unlimited') return ['allowed' => true, 'unlocked' => true, 'reason' => null] + $summary;

    if ($summary['mode'] === 'fixed_latest') {
        $allowed = guest_post_is_open($conn, $post_id, (int)$summary['limit']);
        $reason = $summary['tier'] === 'guest' ? 'login_required' : 'tier_limit_reached';
        return ['allowed' => $allowed, 'unlocked' => $allowed, 'reason' => $allowed ? null : $reason] + $summary;
    }

    if (!$user) return ['allowed' => false, 'reason' => 'login_required'] + $summary;

    $stmt = $conn->prepare('SELECT 1 FROM feed_post_views WHERE user_id = ? AND post_id = ? AND access_date = CURDATE()');
    $stmt->execute([$user['id'], $post_id]);
    if ($stmt->fetchColumn()) return ['allowed' => true, 'unlocked' => true, 'reason' => null] + allowance_summary($conn, $user);
    if (!$consume) return ['allowed' => $summary['remaining'] > 0, 'unlocked' => false, 'reason' => $summary['remaining'] > 0 ? null : 'daily_limit_reached'] + $summary;

    try {
        $conn->beginTransaction();
        $lock = $conn->prepare('SELECT id FROM users WHERE id = ? FOR UPDATE');
        $lock->execute([$user['id']]);
        $setting = access_setting($conn, $summary['tier']);
        $count = $conn->prepare('SELECT COUNT(*) FROM feed_post_views WHERE user_id = ? AND access_date = CURDATE()');
        $count->execute([$user['id']]);
        if ((int)$count->fetchColumn() >= (int)$setting['post_limit']) {
            $conn->rollBack();
            return ['allowed' => false, 'reason' => 'daily_limit_reached'] + allowance_summary($conn, $user);
        }
        $insert = $conn->prepare('INSERT IGNORE INTO feed_post_views (user_id, post_id, access_date) VALUES (?, ?, CURDATE())');
        $insert->execute([$user['id'], $post_id]);
        $conn->commit();
        return ['allowed' => true, 'unlocked' => true, 'reason' => null] + allowance_summary($conn, $user);
    } catch (Throwable $e) {
        if ($conn->inTransaction()) $conn->rollBack();
        json_response(['status' => 'error', 'message' => 'Could not unlock this post'], 500);
    }
}

function post_owner_or_admin(PDO $conn, int $post_id, array $user): array {
    $stmt = $conn->prepare('SELECT * FROM community_posts WHERE id = ?');
    $stmt->execute([$post_id]);
    $post = $stmt->fetch();
    if (!$post) json_response(['status' => 'error', 'message' => 'Post not found'], 404);
    if ((int)$post['user_id'] !== (int)$user['id'] && $user['role'] !== 'admin') json_response(['status' => 'error', 'message' => 'Not allowed'], 403);
    return $post;
}

function media_public_url(string $relative): string {
    $base = rtrim(getenv('PUBLIC_BACKEND_URL') ?: '', '/');
    return $base . '/' . ltrim($relative, '/');
}

function normalize_embed(string $url): ?string {
    if (!filter_var($url, FILTER_VALIDATE_URL)) return null;
    $host = strtolower(parse_url($url, PHP_URL_HOST) ?: '');
    $path = trim(parse_url($url, PHP_URL_PATH) ?: '', '/');
    parse_str(parse_url($url, PHP_URL_QUERY) ?: '', $query);
    if (in_array($host, ['youtube.com', 'www.youtube.com', 'm.youtube.com'], true) && !empty($query['v'])) return 'https://www.youtube-nocookie.com/embed/' . rawurlencode($query['v']);
    if ($host === 'youtu.be' && $path) return 'https://www.youtube-nocookie.com/embed/' . rawurlencode(explode('/', $path)[0]);
    if (in_array($host, ['vimeo.com', 'www.vimeo.com'], true) && preg_match('/^\d+$/', $path)) return 'https://player.vimeo.com/video/' . $path;
    return null;
}
?>
