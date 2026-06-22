import Link from 'next/link';

export default function Custom404Page() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '12px' }}>404</p>
        <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>Page not found</h1>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>
          The page you are looking for does not exist.
        </p>
        <Link href="/" style={{ display: 'inline-flex', padding: '12px 20px', borderRadius: '999px', background: '#0062ff', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>
          Back to Home
        </Link>
      </div>
    </main>
  );
}
