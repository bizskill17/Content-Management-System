'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Courses', href: '/courses' },
  { label: 'Tools', href: '/tools' },
  { label: 'Templates', href: '/templates' },
  { label: 'Checklists', href: '/checklists' },
  { label: 'Downloads', href: '/downloads' },
  { label: 'Blog', href: '/blog' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Pricing', href: '/pricing' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span>JhatPat<span className={styles.logoAI}>AI</span></span>
        </Link>

        <ul className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={styles.link} onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          {user ? (
            <div className={styles.userBox}>
              {user.subscription_status === 'active' && (
                <span className={styles.proBadge}>PRO</span>
              )}
              <span className={styles.userName}>Hi, {user.name}</span>
              <button onClick={logout} className={styles.logoutBtn}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline" style={{ padding: '8px 20px', fontSize: '0.875rem' }}>Login</Link>
              <Link href="/register" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.875rem' }}>Start Free</Link>
            </>
          )}
        </div>

        <button
          className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
