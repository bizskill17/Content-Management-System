'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ResourceGrid from '@/components/ResourceGrid';
import { getResources } from '@/lib/api';

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Checklists — JhatPatAI';
    getResources('checklist')
      .then(res => {
        setChecklists(res || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-h)', minHeight: '80vh' }}>
        <section style={{ padding: '64px 0', background: '#ecfdf5' }}> {/* Green tint */}
          <div className="container" style={{ textAlign: 'center' }}>
            <h1 className="section-title">Step-by-Step Checklists</h1>
            <p className="section-sub">Bulletproof processes for marketing, setup, and audits.</p>
          </div>
        </section>
        <section style={{ padding: '64px 0' }}>
          <div className="container">
            <ResourceGrid resources={checklists} typeLabel="Checklists" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
