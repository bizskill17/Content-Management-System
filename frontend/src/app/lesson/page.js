'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost/backend/api';

export default function LessonPage() {
  const { user } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = window.location.pathname;
    const slug = path.split('/').filter(Boolean).pop();

    if (slug === 'lesson') {
      window.location.href = '/courses';
      return;
    }

    fetch(`${API}/get-lesson.php?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === 'success') {
          const nextLesson = {
            ...d.data,
            prev: d.prev,
            next: d.next,
          };
          setLesson(nextLesson);

          return fetch(`${API}/get-course.php?slug=${nextLesson.course_slug}`)
            .then((r) => r.json())
            .then((courseData) => {
              if (courseData.status === 'success') {
                setCourse(courseData.data);
              }
            });
        }
        return null;
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Navbar />;

  if (!lesson) {
    return (
      <>
        <Navbar />
        <div style={{ paddingTop: 'var(--nav-h)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
          <div>
            <p style={{ fontSize: '3rem' }}>?</p>
            <h2>Lesson not found</h2>
            <Link href="/courses" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>
              Back to Courses
            </Link>
          </div>
        </div>
      </>
    );
  }

  const isLocked = lesson.access_type === 'paid' && user?.subscription_status !== 'active';

  return (
    <>
      <Navbar />
      <div className={styles.layout}>
        {course ? (
          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <p className={styles.sidebarEyebrow}>Course Outline</p>
              <h2 className={styles.sidebarTitle}>{course.name}</h2>

              <Link
                href={`/course/${lesson.course_slug}`}
                className={`${styles.introLink} ${lesson.slug === lesson.course_slug ? styles.activeIntroLink : ''}`}
              >
                <span className={styles.introLabel}>Introduction</span>
                <span className={styles.introText}>Course Introduction</span>
              </Link>

              <div className={styles.sidebarSections}>
                {course.sections?.map((section) => {
                  const isActiveSection = section.lessons?.some((item) => item.slug === lesson.slug);
                  return (
                    <div key={section.id} className={`${styles.sidebarSection} ${isActiveSection ? styles.sidebarSectionActive : ''}`}>
                      <div className={styles.sidebarSectionHead}>
                        <span className={styles.sidebarSectionName}>{section.name}</span>
                        <span className={styles.sidebarSectionCount}>{section.lessons?.length || 0}</span>
                      </div>

                      <div className={styles.chapterList}>
                        {section.lessons?.map((item) => (
                          <Link
                            key={item.id}
                            href={`/lesson/${item.slug}`}
                            className={`${styles.chapterLink} ${item.slug === lesson.slug ? styles.chapterLinkActive : ''}`}
                          >
                            <span className={styles.chapterDot} />
                            <span className={styles.chapterText}>{item.title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        ) : null}

        <main className={styles.content}>
          <div className={styles.contentInner}>
            <div className={styles.lessonMeta}>
              <span className={`badge ${isLocked ? 'badge-orange' : 'badge-green'}`}>
                {lesson.access_type} {user?.subscription_status === 'active' ? 'Unlocked' : ''}
              </span>
            </div>
            <h1 className={styles.lessonTitle}>{lesson.title}</h1>

            {lesson.thumbnail ? (
              <div className={styles.heroMedia}>
                <img src={lesson.thumbnail} alt={lesson.title} className={styles.heroImage} />
              </div>
            ) : null}

            {isLocked ? (
              <div className={styles.paywall}>
                <span className={styles.paywallIcon}>Locked</span>
                <h2>This is a Premium Lesson</h2>
                <p>Upgrade your plan to access this and all other premium lessons.</p>
                <Link href="/pricing" className="btn btn-primary">Unlock Now</Link>
              </div>
            ) : (
              <div
                className="lesson-prose"
                dangerouslySetInnerHTML={{ __html: lesson.html_content }}
              />
            )}

            <div className={styles.lessonNavigation}>
              <div className={styles.navMain}>
                {lesson.prev ? (
                  <Link href={`/lesson/${lesson.prev.slug}`} className={styles.navButton}>
                    <span className={styles.navSubtitle}>&larr; Previous Chapter</span>
                    <span className={styles.navBtnTitle}>{lesson.prev.title}</span>
                  </Link>
                ) : <div className={styles.navPlaceholder} />}

                <Link href={`/course/${lesson.course_slug}`} className={styles.backLink}>
                  <span className={styles.backIcon}>≡</span>
                  Go to Sections
                </Link>

                {lesson.next ? (
                  <Link href={`/lesson/${lesson.next.slug}`} className={`${styles.navButton} ${styles.navNext}`}>
                    <span className={styles.navSubtitle}>Next Chapter &rarr;</span>
                    <span className={styles.navBtnTitle}>{lesson.next.title}</span>
                  </Link>
                ) : <div className={styles.navPlaceholder} />}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
