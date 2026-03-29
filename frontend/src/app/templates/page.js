'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ResourceGrid from '@/components/ResourceGrid';
import { getResources } from '@/lib/api';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Templates — JhatPatAI';
    getResources('template')
      .then(res => {
        setTemplates(res || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)', minHeight: '80vh' }}>
        <section style={{ padding: '64px 0', background: '#f5f3ff' }}> {/* Purple tint */}
          <div className="container" style={{ textAlign: 'center' }}>
            <h1 className="section-title">Ready-to-Use Templates</h1>
            <p className="section-sub">Copy, paste, and execute. Stop starting from scratch.</p>
          </div>
        </section>
        <section style={{ padding: '64px 0' }}>
          <div className="container">
            <ResourceGrid resources={templates} typeLabel="Templates" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
