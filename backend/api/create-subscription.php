<?php
// backend/api/create-subscription.php
include 'config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id) && !empty($data->email)) {
    // We use the Razorpay Subscription API
    // Request for creating a subscription
    $api_url = "https://api.razorpay.com/v1/subscriptions";
    
    $payload = [
        "plan_id" => RAZORPAY_PLAN_ID,
        "total_count" => 12, // 1 year (12 cycles depends on plan setup, but links uses count)
        "quantity" => 1,
        "customer_notify" => 1,
        "notes" => [
            "user_id" => $data->user_id
        ]
    ];

    $ch = curl_init($api_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Basic ' . base64_encode(RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET)
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 200) {
        $result = json_decode($response);
        echo json_encode([
            "status" => "success",
            "subscription_id" => $result->id,
            "key_id" => RAZORPAY_KEY_ID
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Subscription creation failed", "details" => $response]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "User ID and Email required"]);
}
?>
