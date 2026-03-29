const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost/backend/api";

async function fetcher(endpoint) {
  const url = `${API_BASE}/${endpoint}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    const json = await res.json();
    if (json.status === "error") throw new Error(json.message);
    return json.data || json;
  } catch (err) {
    console.error(`❌ Fetch failed for ${url}:`, err.message);
    throw err;
  }
}

export const getCourses = () => fetcher("get-courses.php");
export const getCourse = (slug) => fetcher(`get-course.php?slug=${slug}`);
export const getLesson = (slug) => fetcher(`get-lesson.php?slug=${slug}`);
export const getBlogs = () => fetcher("get-blog.php");
export const getBlog = (slug) => fetcher(`get-blog.php?slug=${slug}`);
export const getResources = (type) => fetcher(`get-resources.php?type=${type}`);
