'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './page.module.css';

const SHEET_WEBAPP_URL =
  process.env.NEXT_PUBLIC_SHEET_WEBAPP_URL ||
  'https://script.google.com/macros/s/AKfycbw3MBwntklS-vU11kPe5ANF9wsG0MlwnG5MLMMYVYOhHYgDqFvsclpcshSEEfwxyhG_2w/exec';

function normalizeStatus(status = '') {
  const value = String(status).trim().toLowerCase();
  if (value.startsWith('error')) return 'error';
  if (value === 'sync') return 'sync';
  if (value === 'delete') return 'delete';
  if (value === 'synced') return 'synced';
  return value || 'unknown';
}

function formatLabel(value) {
  if (!value) return 'Unknown';
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function DashboardPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let active = true;

    fetch(SHEET_WEBAPP_URL, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const nextRows = Array.isArray(data.rows) ? data.rows : [];
        setRows(nextRows);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Unable to load dashboard data');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const courseOptions = useMemo(() => {
    return ['all', ...new Set(rows.map((row) => row.course_name).filter(Boolean))];
  }, [rows]);

  const typeOptions = useMemo(() => {
    return ['all', ...new Set(rows.map((row) => row.type).filter(Boolean))];
  }, [rows]);

  const statusOptions = useMemo(() => {
    return ['all', ...new Set(rows.map((row) => normalizeStatus(row.status)).filter(Boolean))];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return rows.filter((row) => {
      const rowStatus = normalizeStatus(row.status);
      const courseMatch = selectedCourse === 'all' || row.course_name === selectedCourse;
      const typeMatch = selectedType === 'all' || row.type === selectedType;
      const statusMatch = selectedStatus === 'all' || rowStatus === selectedStatus;
      const searchMatch =
        !query ||
        [row.title, row.slug, row.section_name, row.course_name, row.category, row.type]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return courseMatch && typeMatch && statusMatch && searchMatch;
    });
  }, [rows, deferredSearch, selectedCourse, selectedType, selectedStatus]);

  const kpis = useMemo(() => {
    const counts = {
      total: rows.length,
      synced: 0,
      errors: 0,
      pending: 0,
      courses: new Set(),
      lessons: 0,
    };

    rows.forEach((row) => {
      const status = normalizeStatus(row.status);
      if (row.course_name) counts.courses.add(row.course_name);
      if (row.type === 'lesson') counts.lessons += 1;
      if (status === 'synced') counts.synced += 1;
      if (status === 'error') counts.errors += 1;
      if (status === 'sync' || status === 'delete') counts.pending += 1;
    });

    return [
      { label: 'Total Rows', value: counts.total, tone: 'blue' },
      { label: 'Courses', value: counts.courses.size, tone: 'cyan' },
      { label: 'Lessons', value: counts.lessons, tone: 'amber' },
      { label: 'Pending Actions', value: counts.pending, tone: 'violet' },
      { label: 'Synced', value: counts.synced, tone: 'green' },
      { label: 'Errors', value: counts.errors, tone: 'red' },
    ];
  }, [rows]);

  const statusBreakdown = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const key = normalizeStatus(row.status);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({ status, count, percent: rows.length ? (count / rows.length) * 100 : 0 }));
  }, [rows]);

  const topCourses = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const key = row.course_name || 'No course';
      const current = map.get(key) || { name: key, total: 0, errors: 0, pending: 0 };
      current.total += 1;
      const status = normalizeStatus(row.status);
      if (status === 'error') current.errors += 1;
      if (status === 'sync' || status === 'delete') current.pending += 1;
      map.set(key, current);
    });
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 8);
  }, [rows]);

  const attentionRows = useMemo(() => {
    return rows
      .filter((row) => {
        const status = normalizeStatus(row.status);
        return status === 'error' || status === 'sync' || status === 'delete';
      })
      .slice(0, 12);
  }, [rows]);

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroCard}>
              <div>
                <p className="section-label">Content Ops</p>
                <h1 className={styles.title}>Sheet Control Dashboard</h1>
                <p className={styles.sub}>
                  Track sync health, search content rows, filter by course, and spot problem areas before they hit production.
                </p>
              </div>
              <div className={styles.heroMeta}>
                <span className="badge badge-blue">{rows.length} rows loaded</span>
                <span className={styles.sourceLabel}>Live source: Google Sheets web app</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.panelSection}>
          <div className="container">
            {loading ? (
              <div className={styles.stateCard}>Loading dashboard data...</div>
            ) : error ? (
              <div className={styles.errorCard}>Could not load dashboard data: {error}</div>
            ) : (
              <>
                <div className={styles.kpiGrid}>
                  {kpis.map((item) => (
                    <article key={item.label} className={`${styles.kpiCard} ${styles[`tone${formatLabel(item.tone)}`]}`}>
                      <span className={styles.kpiLabel}>{item.label}</span>
                      <strong className={styles.kpiValue}>{item.value}</strong>
                    </article>
                  ))}
                </div>

                <div className={styles.filtersCard}>
                  <div className={styles.searchWrap}>
                    <label htmlFor="dashboard-search">Search</label>
                    <input
                      id="dashboard-search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search title, slug, section, category..."
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <label htmlFor="course-filter">Course</label>
                    <select
                      id="course-filter"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className={styles.select}
                    >
                      {courseOptions.map((course) => (
                        <option key={course} value={course}>
                          {course === 'all' ? 'All courses' : course}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.filterGroup}>
                    <label htmlFor="type-filter">Type</label>
                    <select
                      id="type-filter"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className={styles.select}
                    >
                      {typeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type === 'all' ? 'All types' : formatLabel(type)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.filterGroup}>
                    <label htmlFor="status-filter">Status</label>
                    <select
                      id="status-filter"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className={styles.select}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status === 'all' ? 'All statuses' : formatLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.analyticsGrid}>
                  <article className={styles.analyticsCard}>
                    <div className={styles.cardHead}>
                      <h2>Status Mix</h2>
                      <span>{rows.length} total</span>
                    </div>
                    <div className={styles.barList}>
                      {statusBreakdown.map((item) => (
                        <div key={item.status} className={styles.barRow}>
                          <div className={styles.barLabelRow}>
                            <span>{formatLabel(item.status)}</span>
                            <span>{item.count}</span>
                          </div>
                          <div className={styles.barTrack}>
                            <div className={styles.barFill} style={{ width: `${item.percent}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className={styles.analyticsCard}>
                    <div className={styles.cardHead}>
                      <h2>Largest Courses</h2>
                      <span>By row count</span>
                    </div>
                    <div className={styles.courseList}>
                      {topCourses.map((course) => (
                        <div key={course.name} className={styles.courseRow}>
                          <div>
                            <strong>{course.name}</strong>
                            <p>{course.total} items</p>
                          </div>
                          <div className={styles.courseStats}>
                            <span className={styles.statChip}>{course.pending} pending</span>
                            <span className={`${styles.statChip} ${styles.errorChip}`}>{course.errors} errors</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>

                <div className={styles.tableCard}>
                  <div className={styles.cardHead}>
                    <h2>Filtered Rows</h2>
                    <span>{filteredRows.length} matching rows</span>
                  </div>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Type</th>
                          <th>Course</th>
                          <th>Section</th>
                          <th>Status</th>
                          <th>Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.slice(0, 80).map((row, index) => (
                          <tr key={`${row.slug || row.title || 'row'}-${index}`}>
                            <td>
                              <div className={styles.titleCell}>
                                <strong>{row.title || 'Untitled'}</strong>
                                <span>{row.slug || '-'}</span>
                              </div>
                            </td>
                            <td>{formatLabel(row.type || 'unknown')}</td>
                            <td>{row.course_name || '-'}</td>
                            <td>{row.section_name || '-'}</td>
                            <td>
                              <span className={`${styles.statusBadge} ${styles[`status${formatLabel(normalizeStatus(row.status))}`]}`}>
                                {formatLabel(normalizeStatus(row.status))}
                              </span>
                            </td>
                            <td>{row.category || 'General'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.tableCard}>
                  <div className={styles.cardHead}>
                    <h2>Needs Attention</h2>
                    <span>Errors, sync, and delete rows</span>
                  </div>
                  <div className={styles.attentionList}>
                    {attentionRows.length ? attentionRows.map((row, index) => (
                      <div key={`${row.slug || row.title || 'attention'}-${index}`} className={styles.attentionRow}>
                        <div>
                          <strong>{row.title || 'Untitled'}</strong>
                          <p>{row.course_name || 'No course'} • {row.section_name || 'No section'}</p>
                        </div>
                        <span className={`${styles.statusBadge} ${styles[`status${formatLabel(normalizeStatus(row.status))}`]}`}>
                          {formatLabel(normalizeStatus(row.status))}
                        </span>
                      </div>
                    )) : (
                      <div className={styles.emptyAttention}>No error or pending rows right now.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
