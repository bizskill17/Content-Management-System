# Community feed deployment

1. Back up the production database, then import `database.sql`. All table creation statements are idempotent and the feed tier seed uses an upsert.
2. Configure the variables listed in `backend/.env.example` through the Hostinger PHP environment. The application intentionally has no credential fallbacks.
3. Rotate the database password and all Razorpay credentials that were previously committed, then configure the new values in Hostinger.
4. Set `FRONTEND_ORIGIN` to the exact HTTPS frontend origin and `PUBLIC_BACKEND_URL` to the public backend base URL.
5. Ensure `backend/uploads/community` is writable by PHP but cannot execute scripts. Uploaded filenames are generated, and only approved MIME types are accepted.
6. Configure Razorpay to send webhooks to `backend/api/razorpay-webhook.php` and set the matching webhook secret.
7. Promote at least one user to `role = 'admin'`, sign in again, create the first community space, and review limits at `/community/admin`.
8. Build the frontend with `NEXT_PUBLIC_API_BASE` pointing to the HTTPS PHP API and deploy the generated `frontend/out` directory.

For local HTTP development, use `COOKIE_SECURE=0` and `COOKIE_SAMESITE=Lax`. Production must use `COOKIE_SECURE=1`; cross-site frontend/API deployments require HTTPS and `COOKIE_SAMESITE=None`.
