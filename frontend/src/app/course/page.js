'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost/backend/api';

export default function CourseDetailPage() {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = window.location.pathname;
    const slug = path.split('/').filter(Boolean).pop();

    if (slug === 'course') {
      window.location.href = '/courses';
      return;
    }

    fetch(`${API}/get-course.php?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setCourse(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Navbar />;

  if (!course) {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: 'var(--nav-h)', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '3rem' }}>?</p>
            <h2>Course not found</h2>
            <Link href="/courses" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>
              Back to Courses
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const totalLessons = course.sections?.reduce((acc, section) => acc + (section.lessons?.length || 0), 0) || 0;

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <p className={styles.sidebarEyebrow}>Course Outline</p>
              <h2 className={styles.sidebarTitle}>{course.name}</h2>

              <Link href={`/course/${course.slug}`} className={`${styles.introLink} ${styles.activeIntroLink}`}>
                <span className={styles.introLabel}>Introduction</span>
                <span className={styles.introText}>Course Introduction</span>
              </Link>

              <div className={styles.sidebarSections}>
                {course.sections?.map((section) => (
                  <div key={section.id} className={styles.sidebarSection}>
                    <div className={styles.sidebarSectionHead}>
                      <span className={styles.sidebarSectionName}>{section.name}</span>
                      <span className={styles.sidebarSectionCount}>{section.lessons?.length || 0}</span>
                    </div>

                    <div className={styles.chapterList}>
                      {section.lessons?.map((lesson) => (
                        <Link key={lesson.id} href={`/lesson/${lesson.slug}`} className={styles.chapterLink}>
                          <span className={styles.chapterDot} />
                          <span className={styles.chapterText}>{lesson.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className={styles.content}>
            <section className={styles.hero}>
              <div className={styles.contentContainer}>
                <div className={styles.breadcrumb}>
                  <Link href="/courses">Courses</Link> / <span>{course.name}</span>
                </div>
                <div className={styles.heroGrid}>
                  <div className={styles.heroLeft}>
                    <span className="badge badge-blue">{course.category || 'General'}</span>
                    <h1 className={styles.title}>{course.name}</h1>
                    <div
                      className="lesson-prose"
                      style={{ marginTop: '0', color: 'var(--text-muted)' }}
                      dangerouslySetInnerHTML={{ __html: course.description }}
                    />
                    <div className={styles.meta}>
                      <span>Lessons {totalLessons}</span>
                      <span>Sections {course.sections?.length || 0}</span>
                    </div>
                    {course.sections?.[0]?.lessons?.[0] ? (
                      <Link
                        href={`/lesson/${course.sections[0].lessons[0].slug}`}
                        className="btn btn-primary"
                        style={{ marginTop: '24px' }}
                      >
                        Start Learning
                      </Link>
                    ) : null}
                  </div>
                  <div className={styles.heroRight}>
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.name} className={styles.thumb} />
                    ) : (
                      <div className={styles.thumbPlaceholder}>Course</div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.curriculum}>
              <div className={styles.contentContainer}>
                <h2 className={styles.currTitle}>Course Curriculum</h2>
                <div className={styles.sections}>
                  {course.sections?.map((section) => (
                    <details key={section.id} className={styles.section} open>
                      <summary className={styles.sectionHead}>
                        <span className={styles.sectionName}>{section.name}</span>
                        <span className={styles.sectionCount}>{section.lessons?.length || 0} lessons</span>
                      </summary>
                      <ul className={styles.lessonList}>
                        {section.lessons?.map((lesson) => (
                          <li key={lesson.id} className={styles.lesson}>
                            <Link href={`/lesson/${lesson.slug}`} className={styles.lessonLink}>
                              {lesson.thumbnail ? (
                                <img src={lesson.thumbnail} alt={lesson.title} className={styles.lessonThumb} />
                              ) : (
                                <span className={styles.lessonThumbPlaceholder}>Preview</span>
                              )}
                              <span className={styles.lessonIcon}>
                                {lesson.access_type === 'paid' ? 'Locked' : 'Play'}
                              </span>
                              <span className={styles.lessonTitle}>{lesson.title}</span>
                              <span className={`badge ${lesson.access_type === 'free' ? 'badge-green' : 'badge-orange'}`}>
                                {lesson.access_type}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
