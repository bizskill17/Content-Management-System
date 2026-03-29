<?php
// backend/api/register.php
include 'config.php';

$data = json_decode(file_get_contents("php://input"));

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name) && !empty($data->email) && !empty($data->password) && !empty($data->mobile)) {
    // Check if email already exists
    $check_stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $check_stmt->execute([$data->email]);
    if ($check_stmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "Email already registered"]);
        exit();
    }

    // Hash password
    $hashed_password = password_hash($data->password, PASSWORD_BCRYPT);

    try {
        $stmt = $conn->prepare("INSERT INTO users (name, email, password, mobile) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data->name, $data->email, $hashed_password, $data->mobile]);

        echo json_encode([
            "status" => "success", 
            "message" => "User registered successfully",
            "user" => [
                "id" => $conn->lastInsertId(),
                "name" => $data->name,
                "email" => $data->email,
                "mobile" => $data->mobile
            ]
        ]);
    } catch(PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Registration failed: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Incomplete data"]);
}
?>
