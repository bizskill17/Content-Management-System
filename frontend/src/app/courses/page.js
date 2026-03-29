'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CourseCard from '@/components/CourseCard';
import styles from './page.module.css';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost/backend/api'}/get-courses.php`)
      .then(r => r.json())
      .then(d => { setCourses(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(courses.map(c => c.category || 'General'))];

  const filtered = courses.filter(c => {
    const matchCat = activeCategory === 'All' || (c.category || 'General') === activeCategory;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Page Header */}
        <section className={styles.header}>
          <div className="container">
            <p className="section-label">All Courses</p>
            <h1 className="section-title">Master AI, One Course at a Time</h1>
            <p className="section-sub">Practical, fast, and business-focused AI courses for everyone.</p>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className={styles.filterSection}>
          <div className="container">
            <div className={styles.filters}>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`${styles.filterBtn} ${activeCategory === cat ? styles.active : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Course Grid */}
        <section className={styles.gridSection}>
          <div className="container">
            {loading ? (
              <div className={styles.grid}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={styles.skelCard}>
                    <div className={`skeleton ${styles.skelThumb}`} />
                    <div style={{ padding: '16px' }}>
                      <div className={`skeleton ${styles.skelLine}`} style={{ width: '80%', height: 18, marginBottom: 10 }} />
                      <div className={`skeleton ${styles.skelLine}`} style={{ width: '60%', height: 14 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <>
                <p className={styles.count}>{filtered.length} course{filtered.length !== 1 ? 's' : ''} found</p>
                <div className={styles.grid}>
                  {filtered.map(c => <CourseCard key={c.id} course={c} />)}
                </div>
              </>
            ) : (
              <div className={styles.empty}>
                <p>😕 No courses found for &ldquo;{search}&rdquo;</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
