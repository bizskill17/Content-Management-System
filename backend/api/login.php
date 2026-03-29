<?php
// backend/api/login.php
include 'config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->email) && !empty($data->password)) {
    try {
        $stmt = $conn->prepare("
            SELECT u.id, u.name, u.email, u.mobile, u.password, u.role,
                   s.status as subscription_status, s.plan as subscription_plan
            FROM users u
            LEFT JOIN subscriptions s ON u.id = s.user_id
            WHERE u.email = ?
        ");
        $stmt->execute([$data->email]);
        $user = $stmt->fetch();

        if ($user && password_verify($data->password, $user['password'])) {
            // Admin Over-ride (Role check from DB)
            if ($user['role'] === 'admin') {
                $user['subscription_status'] = 'active';
                $user['subscription_plan'] = 'Admin Access';
            }
            
            // Remove password from response
            unset($user['password']);
            
            echo json_encode([
                "status" => "success",
                "message" => "Login successful",
                "user" => $user
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
        }
    } catch(PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Login failed: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Email and password required"]);
}
?>
