import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <div className={styles.logo}>⚡ JhatPat<span>AI</span></div>
          <p>India&apos;s fastest way to master AI skills for business, content, and career growth.</p>
          <p className={styles.powered}>Powered by <strong>BizSkill</strong></p>
        </div>
        <div className={styles.col}>
          <h4>Learn</h4>
          <Link href="/courses">All Courses</Link>
          <Link href="/tools">AI Tools</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/checklists">Checklists</Link>
          <Link href="/downloads">Downloads</Link>
        </div>
        <div className={styles.col}>
          <h4>Company</h4>
          <Link href="/blog">Blog</Link>
          <Link href="/about">About Us</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div className={styles.col}>
          <h4>Account</h4>
          <Link href="/login">Login</Link>
          <Link href="/register">Sign Up Free</Link>
          <Link href="/dashboard">My Dashboard</Link>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} JhatPatAI. All rights reserved.</p>
      </div>
    </footer>
  );
}
