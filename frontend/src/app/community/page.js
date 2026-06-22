'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import {
  COMMUNITY,
  COMMUNITY_GROUPS,
  COMMUNITY_MEMBERS,
  getGroupBySlug,
  getPostsForGroup,
  getTopContributors,
  getMemberBySlug,
} from '@/lib/community';
import styles from './page.module.css';

const REACTION_LABELS = {
  like: 'Like',
  celebrate: 'Celebrate',
  insightful: 'Insightful',
};

function formatType(type) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export default function CommunityPage() {
  const searchParams = useSearchParams();
  const [activeGroup, setActiveGroup] = useState('all');
  const [selectedReactions, setSelectedReactions] = useState({});
  const topContributors = useMemo(() => getTopContributors().slice(0, 3), []);

  useEffect(() => {
    const requestedGroup = searchParams.get('group');
    if (!requestedGroup) return;

    const exists = COMMUNITY_GROUPS.some((group) => group.slug === requestedGroup);
    if (exists) setActiveGroup(requestedGroup);
  }, [searchParams]);

  const posts = useMemo(() => getPostsForGroup(activeGroup), [activeGroup]);
  const activeGroupData = activeGroup === 'all' ? null : getGroupBySlug(activeGroup);

  const toggleReaction = (postId, reactionType) => {
    setSelectedReactions((current) => {
      const existing = current[postId];
      return {
        ...current,
        [postId]: existing === reactionType ? null : reactionType,
      };
    });
  };

  return (
    <>
      <Navbar />
      <main className={styles.shell}>
        <section className={styles.hero}>
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.heroCopy}>
              <span className="badge badge-blue">Community</span>
              <h1>{COMMUNITY.name}</h1>
              <p>{COMMUNITY.tagline}</p>
              <div className={styles.heroActions}>
                <button className="btn btn-primary">Share an Update</button>
                <button className="btn btn-outline">Ask a Question</button>
              </div>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <strong>{COMMUNITY.stats.members.toLocaleString()}</strong>
                <span>Members</span>
              </div>
              <div className={styles.statCard}>
                <strong>{COMMUNITY.stats.groups}</strong>
                <span>Active Groups</span>
              </div>
              <div className={styles.statCard}>
                <strong>{COMMUNITY.stats.postsThisWeek}</strong>
                <span>Posts This Week</span>
              </div>
              <div className={styles.statCard}>
                <strong>{COMMUNITY.stats.solvedQuestions}</strong>
                <span>Questions Solved</span>
              </div>
            </div>
          </div>
        </section>

        <section className={`container ${styles.layout}`}>
          <aside className={styles.sidebar}>
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>Groups</h2>
                <span>{COMMUNITY_GROUPS.length} spaces</span>
              </div>

              <button
                className={`${styles.groupButton} ${activeGroup === 'all' ? styles.groupButtonActive : ''}`}
                onClick={() => setActiveGroup('all')}
              >
                <strong>All Activity</strong>
                <span>Cross-club feed and highlights</span>
              </button>

              {COMMUNITY_GROUPS.map((group) => (
                <button
                  key={group.slug}
                  className={`${styles.groupButton} ${activeGroup === group.slug ? styles.groupButtonActive : ''}`}
                  style={{ '--group-accent': group.accent }}
                  onClick={() => setActiveGroup(group.slug)}
                >
                  <strong>{group.name}</strong>
                  <span>{group.description}</span>
                  <small>{group.members} members • {group.momentum}</small>
                </button>
              ))}
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>Top Contributors</h2>
                <span>This week</span>
              </div>
              <div className={styles.contributorList}>
                {topContributors.map((member, index) => (
                  <Link key={member.slug} href={`/community/member?slug=${member.slug}`} className={styles.contributorCard}>
                    <div className={styles.avatar}>{member.avatar}</div>
                    <div>
                      <strong>#{index + 1} {member.name}</strong>
                      <p>{member.badge}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <section className={styles.feed}>
            <div className={styles.composer}>
              <div className={styles.composerAvatar}>JP</div>
              <div className={styles.composerBody}>
                <strong>Share with the club</strong>
                <p>Post a win, ask a question, or start a discussion in the right group.</p>
                <div className={styles.composerActions}>
                  <button>Post Update</button>
                  <button>Ask Question</button>
                  <button>Create Poll</button>
                </div>
              </div>
            </div>

            <div className={styles.feedHeader}>
              <div>
                <h2>{activeGroupData ? activeGroupData.name : 'Club Feed'}</h2>
                <p>{activeGroupData ? activeGroupData.description : 'Everything happening across JhatPat AI Club right now.'}</p>
              </div>
              <span className="badge badge-orange">{posts.length} live threads</span>
            </div>

            <div className={styles.postList}>
              {posts.map((post) => {
                const author = getMemberBySlug(post.authorSlug);
                const selectedReaction = selectedReactions[post.id];
                return (
                  <article key={post.id} className={styles.postCard}>
                    <div className={styles.postHead}>
                      <Link href={`/community/member?slug=${author.slug}`} className={styles.memberLink}>
                        <div className={styles.avatar}>{author.avatar}</div>
                        <div>
                          <strong>{author.name}</strong>
                          <p>{author.role} • {formatType(post.type)} • {post.time}</p>
                        </div>
                      </Link>
                      <span className={styles.groupPill} style={{ '--pill-accent': getGroupBySlug(post.groupSlug)?.accent || '#0062ff' }}>
                        {getGroupBySlug(post.groupSlug)?.name}
                      </span>
                    </div>

                    <div className={styles.postBody}>
                      <h3>{post.title}</h3>
                      <p>{post.body}</p>
                      <div className={styles.tagRow}>
                        {post.tags.map((tag) => (
                          <span key={tag}>#{tag}</span>
                        ))}
                      </div>
                    </div>

                    <div className={styles.reactionRow}>
                      {Object.entries(REACTION_LABELS).map(([reactionType, label]) => {
                        const baseCount = post.reactions[reactionType];
                        const isActive = selectedReaction === reactionType;
                        const count = isActive ? baseCount + 1 : baseCount;
                        return (
                          <button
                            key={reactionType}
                            className={`${styles.reactionButton} ${isActive ? styles.reactionButtonActive : ''}`}
                            onClick={() => toggleReaction(post.id, reactionType)}
                          >
                            {label} {count}
                          </button>
                        );
                      })}
                    </div>

                    <div className={styles.commentBlock}>
                      {post.comments.map((comment, index) => {
                        const commenter = COMMUNITY_MEMBERS.find((member) => member.slug === comment.authorSlug);
                        return (
                          <div key={`${post.id}-${index}`} className={styles.comment}>
                            <div className={styles.commentAvatar}>{commenter.avatar}</div>
                            <div className={styles.commentBody}>
                              <strong>{commenter.name}</strong>
                              <span>{comment.time}</span>
                              <p>{comment.text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className={styles.rail}>
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>Participation Push</h2>
                <span>Weekly</span>
              </div>
              <div className={styles.challengeCard}>
                <strong>{COMMUNITY.weeklyChallenge.title}</strong>
                <p>{COMMUNITY.weeklyChallenge.description}</p>
                <small>{COMMUNITY.weeklyChallenge.prize}</small>
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <h2>Member Spotlight</h2>
                <span>Profiles</span>
              </div>
              <div className={styles.spotlightList}>
                {COMMUNITY_MEMBERS.map((member) => (
                  <Link key={member.slug} href={`/community/member?slug=${member.slug}`} className={styles.spotlightCard}>
                    <div className={styles.avatar}>{member.avatar}</div>
                    <div>
                      <strong>{member.name}</strong>
                      <p>{member.role}</p>
                      <small>{member.interests.slice(0, 2).join(' • ')}</small>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </>
  );
}
