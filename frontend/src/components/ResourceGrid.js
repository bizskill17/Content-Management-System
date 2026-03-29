import Link from 'next/link';
import styles from './ResourceGrid.module.css';

export default function ResourceGrid({ resources, typeLabel }) {
  if (!resources || resources.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No {typeLabel.toLowerCase()} available yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {resources.map(res => {
        let thumbUrl = res.thumbnail;
        if (res.thumbnail && res.thumbnail.startsWith('uploads/')) {
          const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost/backend/api';
          const baseUrl = apiBase.replace('/api', '');
          thumbUrl = `${baseUrl}/${res.thumbnail}`;
        }

        return (
          <a 
            href={res.file_url || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            key={res.id} 
            className={styles.card}
          >
            <div className={styles.thumb}>
              {thumbUrl 
                ? <img src={thumbUrl} alt={res.title} className={styles.thumbImg} />
              : <div className={styles.thumbPlaceholder}>
                  <span className={styles.icon}>
                    {res.type === 'tool' ? '🛠️' : res.type === 'template' ? '📄' : res.type === 'checklist' ? '✅' : '📥'}
                  </span>
                </div>
            }
            <span className={`badge badge-blue ${styles.badge}`}>{res.category || 'General'}</span>
          </div>
          <h3 className={styles.title}>{res.title}</h3>
          <span className={styles.cta}>
            {res.type === 'tool' ? 'Use Tool →' : res.type === 'template' ? 'Copy Template →' : 'Download Now ⬇'}
          </span>
          </a>
        );
      })}
    </div>
  );
}
