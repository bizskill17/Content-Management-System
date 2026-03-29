'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CourseCard from '@/components/CourseCard';
import { getCourses } from '@/lib/api';
import styles from './page.module.css';
import Link from 'next/link';

const CATEGORIES = [
// ... (same categories)
];

const STATS = [
// ... (same stats)
];

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourses()
      .then(res => {
        if (Array.isArray(res)) setCourses(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const featured = courses.slice(0, 6);

  // Group by category
  const grouped = {};
  courses.forEach(c => {
    const cat = c.category || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(c);
  });

  return (
    <>
      <Navbar />
      <main>

        {/* ═══ HERO ═══ */}
        <section className={styles.hero}>
          <div className={styles.heroBg}>
            <div className={styles.blob1} />
            <div className={styles.blob2} />
            <div className={styles.blob3} />
          </div>
          <div className={`container ${styles.heroContent}`}>
            <span className={styles.heroPill}>🚀 India's #1 AI Learning Platform</span>
            <h1 className={styles.heroTitle}>
              Master AI Skills.<br />
              <span className={styles.heroGrad}>Build the Future.</span>
            </h1>
            <p className={styles.heroSub}>
              Learn AI tools, automation, content creation, and business strategies — the fastest way possible. Powered by BizSkill.
            </p>
            <div className={styles.heroCta}>
              <Link href="/courses" className="btn btn-primary">🎯 Explore Courses</Link>
              <Link href="/tools" className="btn btn-ghost">⚡ Browse AI Tools</Link>
            </div>
            <div className={styles.heroStats}>
              {STATS.map(s => (
                <div key={s.label} className={styles.heroStat}>
                  <span className={styles.heroStatVal}>{s.value}</span>
                  <span className={styles.heroStatLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CATEGORIES ═══ */}
        <section className={styles.cats}>
          <div className="container">
            <p className="section-label">Browse by Topic</p>
            <h2 className="section-title">Explore Learning Categories</h2>
            <div className={styles.catsGrid}>
              {CATEGORIES.map(c => (
                <Link
                  href={`/courses?category=${encodeURIComponent(c.label)}`}
                  key={c.label}
                  className={styles.catCard}
                  style={{ '--cat-bg': c.color }}
                >
                  <span className={styles.catIcon}>{c.icon}</span>
                  <span className={styles.catLabel}>{c.label}</span>
                  <span className={styles.catArrow}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FEATURED COURSES ═══ */}
        <section className={styles.featured}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <p className="section-label">Top Rated</p>
                <h2 className="section-title">Featured Courses</h2>
              </div>
              <Link href="/courses" className="btn btn-outline">View All →</Link>
            </div>
            {featured.length > 0 ? (
              <div className={styles.coursesGrid}>
                {featured.map(c => <CourseCard key={c.id} course={c} />)}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>📚 Courses are being loaded. Please sync content first.</p>
              </div>
            )}
          </div>
        </section>

        {/* ═══ CATEGORIZED SECTION ═══ */}
        {Object.keys(grouped).length > 1 && Object.entries(grouped).slice(0, 3).map(([cat, catCourses]) => (
          <section key={cat} className={styles.catSection}>
            <div className="container">
              <div className={styles.sectionHead}>
                <h2 className={styles.catHeading}>{cat}</h2>
                <Link href={`/courses?category=${encodeURIComponent(cat)}`} className={styles.viewAll}>View all →</Link>
              </div>
              <div className={styles.coursesGrid}>
                {catCourses.slice(0, 4).map(c => <CourseCard key={c.id} course={c} />)}
              </div>
            </div>
          </section>
        ))}

        {/* ═══ RESOURCES BANNER ═══ */}
        <section className={styles.resourcesBanner}>
          <div className="container">
            <div className={styles.bannerGrid}>
              {[
                { icon: '🛠️', title: 'AI Tools', desc: 'Ready-to-use tools for every task', href: '/tools', color: '#0062ff' },
                { icon: '📄', title: 'Templates', desc: 'Copy, paste, done in minutes', href: '/templates', color: '#7c3aed' },
                { icon: '✅', title: 'Checklists', desc: 'Step-by-step process guides', href: '/checklists', color: '#059669' },
                { icon: '📥', title: 'Downloads', desc: 'Free resources to keep forever', href: '/downloads', color: '#d97706' },
              ].map(r => (
                <Link key={r.title} href={r.href} className={styles.bannerCard} style={{ '--card-accent': r.color }}>
                  <span className={styles.bannerIcon}>{r.icon}</span>
                  <div>
                    <h3>{r.title}</h3>
                    <p>{r.desc}</p>
                  </div>
                  <span className={styles.bannerArrow}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA STRIP ═══ */}
        <section className={styles.ctaStrip}>
          <div className="container">
            <div className={styles.ctaBox}>
              <div>
                <h2>Ready to Start Learning?</h2>
                <p>Join 5,000+ learners mastering AI skills every day.</p>
              </div>
              <Link href="/register" className="btn btn-primary">Get Started Free →</Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
