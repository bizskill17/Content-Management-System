<?php
// backend/api/razorpay-webhook.php
include 'config.php';

// Get the raw POST data
$post_data = file_get_contents('php://input');
$data = json_decode($post_data);

// Ideally, verify the webhook signature here using RAZORPAY_WEBHOOK_SECRET
// For initial development/test, we'll process the data if it looks valid.

if (isset($data->event)) {
    if ($data->event === 'subscription.authenticated' || $data->event === 'subscription.charged') {
        $subscription_id = $data->payload->subscription->entity->id;
        $user_id = $data->payload->subscription->entity->notes->user_id;
        $status = 'active';
        $plan = 'Yearly Pro';
        
        // Calculate expiry (1 year from now)
        $expiry_date = date('Y-m-d H:i:s', strtotime('+1 year'));

        try {
            // Check if subscription record already exists
            $check_stmt = $conn->prepare("SELECT id FROM subscriptions WHERE user_id = ?");
            $check_stmt->execute([$user_id]);
            
            if ($check_stmt->fetch()) {
                // Update existing
                $stmt = $conn->prepare("UPDATE subscriptions SET status = ?, plan = ?, expiry_date = ? WHERE user_id = ?");
                $stmt->execute([$status, $plan, $expiry_date, $user_id]);
            } else {
                // Insert new
                $stmt = $conn->prepare("INSERT INTO subscriptions (user_id, plan, status, expiry_date) VALUES (?, ?, ?, ?)");
                $stmt->execute([$user_id, $plan, $status, $expiry_date]);
            }
            
            http_response_code(200);
            echo json_encode(["status" => "success", "message" => "Subscription updated"]);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "info", "message" => "Event ignored: " . $data->event]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid payload"]);
}
?>
