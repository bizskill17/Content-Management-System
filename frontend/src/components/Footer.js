'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/communityApi';
import styles from './Footer.module.css';

const FOOTER_LINKS = [
  { item_key: 'learn_courses', section_label: 'Learn', label: 'All Courses', href: '/courses', sort_order: 10 },
  { item_key: 'learn_tools', section_label: 'Learn', label: 'AI Tools', href: '/tools', sort_order: 20 },
  { item_key: 'learn_templates', section_label: 'Learn', label: 'Templates', href: '/templates', sort_order: 30 },
  { item_key: 'learn_checklists', section_label: 'Learn', label: 'Checklists', href: '/checklists', sort_order: 40 },
  { item_key: 'learn_downloads', section_label: 'Learn', label: 'Downloads', href: '/downloads', sort_order: 50 },
  { item_key: 'company_blog', section_label: 'Company', label: 'Blog', href: '/blog', sort_order: 10 },
  { item_key: 'company_about', section_label: 'Company', label: 'About Us', href: '/about', sort_order: 20 },
  { item_key: 'company_contact', section_label: 'Company', label: 'Contact', href: '/contact', sort_order: 30 },
  { item_key: 'account_login', section_label: 'Account', label: 'Login', href: '/login', sort_order: 10 },
  { item_key: 'account_register', section_label: 'Account', label: 'Sign Up Free', href: '/register', sort_order: 20 },
  { item_key: 'account_dashboard', section_label: 'Account', label: 'My Dashboard', href: '/dashboard', sort_order: 30 },
];

export default function Footer() {
  const [footerLinks, setFooterLinks] = useState(FOOTER_LINKS);

  useEffect(() => {
    let ignore = false;
    fetch(`${API_BASE}/footer-items.php`, { cache: 'no-store', credentials: 'include' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Footer request failed')))
      .then((result) => {
        if (!ignore && Array.isArray(result.data) && result.data.length) setFooterLinks(result.data);
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, []);

  const groups = useMemo(() => {
    return footerLinks.reduce((items, link) => {
      const section = link.section_label || 'More';
      if (!items[section]) items[section] = [];
      items[section].push(link);
      items[section].sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
      return items;
    }, {});
  }, [footerLinks]);

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <div className={styles.logo}>⚡ JhatPat<span>AI</span></div>
          <p>India&apos;s fastest way to master AI skills for business, content, and career growth.</p>
          <p className={styles.powered}>Powered by <strong>BizSkill</strong></p>
        </div>
        {Object.entries(groups).map(([section, links]) => (
          <div className={styles.col} key={section}>
            <h4>{section}</h4>
            {links.map((link) => <Link href={link.href} key={link.item_key || link.href}>{link.label}</Link>)}
          </div>
        ))}
      </div>
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} JhatPatAI. All rights reserved.</p>
      </div>
    </footer>
  );
}
