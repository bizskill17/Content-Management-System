/**
 * JhatPatAI Sync Engine (Google Apps Script)
 * Purpose: Sync Google Docs content to Hostinger Backend
 */

// Note: If you get "Permission Denied", make sure to click "Review Permissions" and allow Drive access.
// This dummy line forces the editor to ask for Drive permissions:
// DriveApp.getFiles();

const API_SAVE_URL = "https://jhatpatai.bizskilledu.com/backend/api/save-content.php"; 
const API_UPLOAD_URL = "https://jhatpatai.bizskilledu.com/backend/api/upload-image.php"; 

function syncAllContent() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Control Panel"); // Make sure your sheet is named this
  const data = sheet.getDataRange().getValues();
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const [type, course_name, section_name, title, slug, source_id, access_type, order_no, status, category] = data[i];
    
    if (status !== "sync" && status !== "delete") continue; // Support both sync and delete
    
    try {
      Logger.log(`${status === "delete" ? "🗑️ Deleting" : "🔄 Syncing"}: ${title} (${type})`);
      
      let htmlContent = "";
      let thumbnail = null;
      if (source_id && status !== "delete") {
        const result = fetchAndCleanHtml(source_id, slug, type, title);
        htmlContent = result.html;
        thumbnail = result.thumbnail;
      }
      
      const payload = {
        type: type,
        course_slug: createSlug(course_name),
        section_name: section_name,
        title: title,
        slug: slug,
        thumbnail: thumbnail, // Set the automatically extracted thumbnail
        html_content: htmlContent,
        access_type: access_type || 'free',
        order_no: order_no || 0,
        category: category || 'General',
        status: status // Pass the status (sync or delete)
      };
      
      const options = {
        method: "post",
        contentType: "application/x-www-form-urlencoded",
        payload: "json_data=" + encodeURIComponent(JSON.stringify(payload)),
        muteHttpExceptions: true
      };
      
      const response = UrlFetchApp.fetch(API_SAVE_URL, options);
      const resData = JSON.parse(response.getContentText());
      
      if (resData.status === "success") {
        sheet.getRange(i + 1, 9).setValue("synced"); // Update status column
      } else {
        sheet.getRange(i + 1, 9).setValue("error: " + JSON.stringify(resData));
      }
      
    } catch (e) {
      Logger.log(`Error syncing row ${i + 1}: ${e.message}`);
      sheet.getRange(i + 1, 9).setValue("error: " + e.message);
    }
  }
}

function fetchAndCleanHtml(fileId, slug, type, title) {
  // Use the internal export URL which usually bypasses the need for manual API activation in Console
  const url = "https://docs.google.com/feeds/download/documents/export/Export?id=" + fileId + "&exportFormat=html";
  const options = {
    method: "get",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  let html = response.getContentText();
  
  if (response.getResponseCode() !== 200) {
    throw new Error("Google Drive Error: " + html);
  }
  const imgResult = processImages(html, slug, type);
  html = imgResult.html;
  let firstImageUrl = imgResult.firstImageUrl;
  
  // 2. Detect YouTube
  html = detectYouTube(html);
  
  // 3. Clean Tags and Attributes
  html = cleanHtmlTags(html, title);
  
  return { html: html, thumbnail: firstImageUrl };
}

function processImages(html, slug, type) {
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  let firstImageUrl = null;
  
  const newHtml = html.replace(imgRegex, (match, src) => {
    let uploadPayload = null;
    
    if (src.startsWith('data:image')) {
      uploadPayload = {
        image: src,
        folder: `${type}/${slug}`,
        fileName: `image-${Date.now()}.png`
      };
    } else if (src.includes('googleusercontent.com')) {
      try {
        const resp = UrlFetchApp.fetch(src);
        const blob = resp.getBlob();
        const base64 = Utilities.base64Encode(blob.getBytes());
        const mimeType = blob.getContentType();
        const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, blob.getBytes())
          .map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
        
        uploadPayload = {
          image: `data:${mimeType};base64,${base64}`,
          folder: `${type}/${slug}`,
          fileName: `img-${hash}.png`
        };
      } catch (e) {
        Logger.log("Failed to fetch remote image: " + e.message);
        return match; // Keep original if fetch fails
      }
    }

    if (uploadPayload) {
      try {
        const uploadOptions = {
          method: "post",
          contentType: "application/x-www-form-urlencoded",
          payload: "json_data=" + encodeURIComponent(JSON.stringify(uploadPayload)),
          muteHttpExceptions: true
        };
        
        const uploadResp = UrlFetchApp.fetch(API_UPLOAD_URL, uploadOptions);
        const uploadResult = JSON.parse(uploadResp.getContentText());
        
        if (uploadResult.status === "success") {
          Logger.log("Image uploaded: " + uploadResult.url);
          if (!firstImageUrl) firstImageUrl = uploadResult.url; // Capture the first image as thumbnail
          return match.replace(src, uploadResult.url);
        } else {
          Logger.log("Image upload failed: " + JSON.stringify(uploadResult));
        }
      } catch (e) {
        Logger.log("Error during image upload: " + e.message);
      }
    }
    
    return match; // Return original if no upload or upload failed
  });

  return { html: newHtml, firstImageUrl: firstImageUrl };
}

function detectYouTube(html) {
  const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
  return html.replace(ytRegex, (match, videoId) => {
    return `<div class="video-container"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
  });
}

function cleanHtmlTags(html, title) {
  // Remove <body> and <head>
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) html = bodyMatch[1];
  
  // Remove styles and clean tags
  html = html.replace(/style="[^"]*"/g, '');
  html = html.replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  html = html.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '$1');
  
  // Remove classes/ids
  html = html.replace(/class="[^"]*"/g, '');
  html = html.replace(/id="[^"]*"/g, '');

  // Strip duplicate title if it's the first visible tag
  if (title) {
    const trimmedTitle = title.trim();
    // Look for the first tag at the start of content (after optional whitespace)
    const firstTagRegex = /^\s*<([a-z1-6]+)[^>]*>([\s\S]*?)<\/\1>/i;
    const match = html.match(firstTagRegex);
    
    if (match) {
      let firstTagText = match[2]
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/<[^>]+>/g, '') // Remove nested tags inside the first tag
        .trim();
      
      if (firstTagText.toLowerCase() === trimmedTitle.toLowerCase()) {
        Logger.log("Stripping duplicate title: " + firstTagText);
        html = html.replace(firstTagRegex, '').trim();
      }
    }
  }
  
  return html;
}

function createSlug(text) {
  if (!text) return "";
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
