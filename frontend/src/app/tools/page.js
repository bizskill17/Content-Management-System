'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ResourceGrid from '@/components/ResourceGrid';
import { getResources } from '@/lib/api';

export default function ToolsPage() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'AI Tools — JhatPatAI';
    getResources('tool')
      .then(res => {
        setTools(res || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)', minHeight: '80vh' }}>
        <section style={{ padding: '64px 0', background: 'var(--bg-muted)' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h1 className="section-title">AI Tools Directory</h1>
            <p className="section-sub">Curated AI tools to automate your business and 10x productivity.</p>
          </div>
        </section>
        <section style={{ padding: '64px 0' }}>
          <div className="container">
            <ResourceGrid resources={tools} typeLabel="Tools" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
