# [JhatPatAI SaaS Platform]

Build a production-grade SaaS platform with Google Docs as CMS, PHP backend, and Next.js frontend.

## Proposed Changes

### Database
#### [NEW] [database.sql](file:///d:/Content%20Management%20System/database.sql)
- Contains CREATE TABLE statements for `courses`, `sections`, `lessons`, `blogs`, `users`, `subscriptions`.

### Backend (PHP)
#### [NEW] [config.php](file:///d:/Content%20Management%20System/backend/config.php)
- Database connection and configuration.
#### [NEW] [save-content.php](file:///d:/Content%20Management%20System/backend/api/save-content.php)
- API to save/update course/lesson/blog content.
#### [NEW] [upload-image.php](file:///d:/Content%20Management%20System/backend/api/upload-image.php)
- API to handle base64 image uploads.
#### [NEW] [get-courses.php](file:///d:/Content%20Management%20System/backend/api/get-courses.php)
#### [NEW] [get-course.php](file:///d:/Content%20Management%20System/backend/api/get-course.php)
#### [NEW] [get-lesson.php](file:///d:/Content%20Management%20System/backend/api/get-lesson.php)
#### [NEW] [get-blog.php](file:///d:/Content%20Management%20System/backend/api/get-blog.php)
#### [NEW] [auth.php](file:///d:/Content%20Management%20System/backend/api/auth.php)
- Register/Login/JWT verification.

### Apps Script
#### [NEW] [Code.gs](file:///d:/Content%20Management%20System/apps-script/Code.gs)
- Logic for reading Google Sheet, fetching Google Docs, cleaning HTML, and syncing to backend.

### Frontend (Next.js)
#### [NEW] [Frontend Application](file:///d:/Content%20Management%20System/frontend/)
- Next.js application using Vanilla CSS for a corporate professional feel.
- Pages: Landing, Courses Grid, Course (Sidebar View), Lesson (Render HTML), Blog List, Blog Detail.

## Verification Plan
### Automated Tests
- Postman/Fetch tests for PHP APIs.
- Script execution for Apps Script.
### Manual Verification
- Verify HTML rendering in Next.js (using provided styling).
- Verify image upload and replacement logic.
