'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost/backend/api';

export default function BlogPage() {
  const [data, setData] = useState(null); // Can be array (list) or object (detail)
  const [loading, setLoading] = useState(true);
  const [isDetail, setIsDetail] = useState(false);

  useEffect(() => {
    // Determine if we are on the list or detail
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    
    // /blog -> ["blog"] -> length 1
    // /blog/my-post -> ["blog", "my-post"] -> length 2
    const slug = parts.length > 1 ? parts[1] : null;

    if (slug) {
      // Detail View
      setIsDetail(true);
      fetch(`${API}/get-blog.php?slug=${slug}`)
        .then(r => r.json())
        .then(res => { setData(res.data); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      // List View
      setIsDetail(false);
      fetch(`${API}/get-blog.php`)
        .then(r => r.json())
        .then(res => { setData(res.data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, []);

  if (loading) return <Navbar />;

  // --- DETAIL VIEW ---
  if (isDetail) {
    if (!data) return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Navbar /><h1 style={{marginTop: '50px'}}>Article Not Found</h1>
        <Link href="/blog" className="btn btn-primary" style={{marginTop:'20px'}}>Back to Blog</Link>
      </div>
    );

    return (
      <>
        <Navbar />
        <main style={{ paddingTop: 'var(--nav-h)', paddingBottom: '80px' }}>
          <article className="container" style={{ maxWidth: '800px', marginTop: '60px' }}>
            <header style={{ marginBottom: '40px', textAlign: 'center' }}>
              <h1 className="section-title">{data.title}</h1>
              <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>
                Published on {new Date(data.created_at).toLocaleDateString()}
              </p>
            </header>
            <div className="lesson-prose" dangerouslySetInnerHTML={{ __html: data.html_content }} />
          </article>
        </main>
        <Footer />
      </>
    );
  }

  // --- LIST VIEW ---
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)' }}>
        <section style={{ padding: '80px 0', background: 'var(--bg-muted)' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <span className="section-label">Our Journal</span>
            <h1 className="section-title">Latest from JhatPatAI</h1>
            <p className="section-sub">Tips, tricks, and tutorials on mastering AI in your daily life.</p>
          </div>
        </section>

        <section style={{ padding: '80px 0' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '30px' }}>
              {data && data.length > 0 ? data.map(post => (
                <div key={post.id} style={{ background: '#fff', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--bg-muted)', overflow: 'hidden' }}>
                    {post.thumbnail 
                      ? <img src={post.thumbnail} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f7ff, #f9f0ff)' }}>
                          <span style={{ fontSize: '2.5rem' }}>📝</span>
                        </div>
                    }
                  </div>
                  <div style={{ padding: '25px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px', lineHeight: '1.4' }}>{post.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', flex: 1, display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.meta_description || "Read our latest blog post about AI and automation..."}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{new Date(post.created_at).toLocaleDateString()}</span>
                      <Link href={`/blog/${post.slug}`} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem', borderRadius: '6px' }}>Read More</Link>
                    </div>
                  </div>
                </div>
              )) : <p style={{textAlign: 'center', width: '100%', gridColumn: '1/-1', padding: '40px'}}>No blog posts found yet.</p>}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
