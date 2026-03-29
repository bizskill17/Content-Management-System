'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ResourceGrid from '@/components/ResourceGrid';
import { getResources } from '@/lib/api';

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Downloads — JhatPatAI';
    getResources('download')
      .then(res => {
        setDownloads(res || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)', minHeight: '80vh' }}>
        <section style={{ padding: '64px 0', background: '#fffbeb' }}> {/* Orange/Yellow tint */}
          <div className="container" style={{ textAlign: 'center' }}>
            <h1 className="section-title">Free Downloads & Assets</h1>
            <p className="section-sub">Swipe files, PDFs, and resources yours to keep forever.</p>
          </div>
        </section>
        <section style={{ padding: '64px 0' }}>
          <div className="container">
            <ResourceGrid resources={downloads} typeLabel="Downloads" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
