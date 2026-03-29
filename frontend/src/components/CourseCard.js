import Link from 'next/link';
import styles from './CourseCard.module.css';
import { getPlainTextPreview } from '@/lib/text';

export default function CourseCard({ course }) {
  const { name, slug, category, thumbnail, description } = course;
  const cleanDesc = getPlainTextPreview(description);

  let thumbUrl = thumbnail;
  if (thumbnail && thumbnail.startsWith('uploads/')) {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost/backend/api';
    const baseUrl = apiBase.replace('/api', '');
    thumbUrl = `${baseUrl}/${thumbnail}`;
  }

  return (
    <Link href={`/course/${slug}`} className={styles.card}>
      <div className={styles.thumb}>
        {thumbUrl ? (
          <img src={thumbUrl} alt={name} loading="lazy" />
        ) : (
          <div className={styles.thumbPlaceholder}><span>BOOK</span></div>
        )}
        <span className="badge badge-blue">{category || 'General'}</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{name}</h3>
        {cleanDesc && (
          <p className={styles.desc}>
            {cleanDesc.slice(0, 100)}
            {cleanDesc.length > 100 ? '...' : ''}
          </p>
        )}
        <div className={styles.footer}>
          <span className={styles.cta}>View Course {'->'}</span>
        </div>
      </div>
    </Link>
  );
}
