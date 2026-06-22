'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { COMMUNITY_GROUPS, COMMUNITY_POSTS, getMemberBySlug, getGroupBySlug } from '@/lib/community';
import styles from './page.module.css';

export default function MemberProfilePage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || 'ananya-mehta';
  const member = getMemberBySlug(slug);

  const posts = useMemo(() => (
    COMMUNITY_POSTS.filter((post) => post.authorSlug === slug)
  ), [slug]);

  if (!member) {
    return (
      <>
        <Navbar />
        <main className={styles.emptyShell}>
          <div className={`container ${styles.emptyState}`}>
            <h1>Member not found</h1>
            <p>The profile you requested does not exist in this community demo yet.</p>
            <Link href="/community" className="btn btn-primary">Back to Community</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.shell}>
        <section className={`container ${styles.hero}`}>
          <Link href="/community" className={styles.backLink}>← Back to JhatPat AI Club</Link>
          <div className={styles.profileCard}>
            <div className={styles.identity}>
              <div className={styles.avatar}>{member.avatar}</div>
              <div>
                <span className="badge badge-blue">{member.badge}</span>
                <h1>{member.name}</h1>
                <p>{member.role} • {member.company} • {member.location}</p>
              </div>
            </div>
            <p className={styles.bio}>{member.bio}</p>
            <div className={styles.interests}>
              {member.interests.map((interest) => (
                <span key={interest}>#{interest}</span>
              ))}
            </div>
          </div>
        </section>

        <section className={`container ${styles.layout}`}>
          <aside className={styles.sidebar}>
            <div className={styles.panel}>
              <h2>Contribution Snapshot</h2>
              <div className={styles.statGrid}>
                <div><strong>{member.stats.posts}</strong><span>Posts</span></div>
                <div><strong>{member.stats.comments}</strong><span>Comments</span></div>
                <div><strong>{member.stats.helpfulAnswers}</strong><span>Helpful Answers</span></div>
                <div><strong>{member.stats.reactions}</strong><span>Reactions Earned</span></div>
              </div>
            </div>

            <div className={styles.panel}>
              <h2>Groups</h2>
              <div className={styles.groupList}>
                {member.groupSlugs.map((groupSlug) => {
                  const group = getGroupBySlug(groupSlug);
                  return (
                    <Link key={group.slug} href={`/community?group=${group.slug}`} className={styles.groupCard}>
                      <strong>{group.name}</strong>
                      <span>{group.description}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className={styles.content}>
            <div className={styles.panel}>
              <h2>Recent Activity</h2>
              <div className={styles.activityList}>
                {member.activity.map((item) => (
                  <div key={item} className={styles.activityItem}>{item}</div>
                ))}
              </div>
            </div>

            <div className={styles.panel}>
              <h2>Recent Posts</h2>
              <div className={styles.postList}>
                {posts.map((post) => (
                  <article key={post.id} className={styles.postCard}>
                    <span className={styles.groupPill}>{getGroupBySlug(post.groupSlug)?.name}</span>
                    <h3>{post.title}</h3>
                    <p>{post.body}</p>
                    <small>{post.time} • {post.comments.length} comments • {Object.values(post.reactions).reduce((sum, value) => sum + value, 0)} reactions</small>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </section>
      </main>
      <Footer />
    </>
  );
}
