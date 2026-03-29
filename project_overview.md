# JhatPatAI: Project Overview

Build a production-grade SaaS platform for AI learning with an automated content pipeline.

## 🚀 Key Features

- **Scalable Content Management:** Use Google Docs as your internal CMS. One-click sync from Google Sheets to the web platform.
- **Automated Clean HTML:** Strips messy styles and converts Docs to clean, semantic HTML.
- **Foolproof Image Pipeline:** Auto-uploads images from Docs to your server and replaces them with optimized URLs.
- **Smart Video Detection:** Automatically embeds YouTube videos from text links.
- **Premium User Experience:** Modern Next.js frontend with a corporate, sidebar-based layout.
- **Secure Access Control:** JWT authentication with "Free" vs "Paid" lesson gates.
- **Optimized for Speed:** Pre-synced content served directly from MySQL for instant page loads.

## 🏗️ Platform Architecture

### 1. Google Workspace (The CMS)
- **Google Docs:** Primary source for lessons, blogs, and resources.
- **Google Sheets:** The "Control Panel" to manage row-by-row sync and access types.
- **Apps Script:** The engine that connects everything.

### 2. Hostinger (The Core Server)
- **PHP APIs:** Handles data storage, image uploads, and authentication logic.
- **MySQL Database:** Securely stores cleaned HTML, course structures, and user data.

### 3. Next.js (The Frontend)
- **User Application:** Blazing-fast, responsive web app for students and readers.
- **Design System:** Professional corporate look branded as **JhatPatAI** (Powered by BizSkill).

---

### The Workflow Pipeline
**Google Docs** (Content) → **Apps Script** (Sync) → **Hostinger/PHP** (Storage) → **Next.js** (Display)
