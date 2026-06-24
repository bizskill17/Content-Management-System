'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, jsonBody } from '@/lib/communityApi';
import styles from './Community.module.css';

const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const formatText = (value) => escapeHtml(value)
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/_([^_]+)_/g, '<em>$1</em>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');
const textToHtml = (value) => value.split(/\n{2,}/).map((part) => `<p>${formatText(part).replace(/\n/g, '<br>')}</p>`).join('');

export default function CommunityFeed({ spaceRoute = false }) {
  const { user, loading: authLoading } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [spaceSlug, setSpaceSlug] = useState('');
  const [sort, setSort] = useState('latest');
  const [posts, setPosts] = useState([]);
  const [allowance, setAllowance] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [embed, setEmbed] = useState('');
  const [files, setFiles] = useState([]);
  const [posting, setPosting] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState('');
  const bodyInput = useRef(null);

  useEffect(() => {
    if (spaceRoute) setSpaceSlug(new URLSearchParams(window.location.search).get('slug') || '');
    apiRequest('community-spaces.php').then((result) => setSpaces(result.data || [])).catch((e) => setError(e.message));
  }, [spaceRoute]);

  const loadFeed = useCallback(async (append = false, next = null) => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ sort, limit: '10' });
      if (spaceSlug) params.set('space', spaceSlug);
      if (next) params.set('cursor', next);
      const result = await apiRequest(`community-feed.php?${params}`);
      setPosts((current) => append ? [...current, ...result.data] : result.data);
      setAllowance(result.allowance); setCursor(result.next_cursor);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [sort, spaceSlug]);

  useEffect(() => { if (!spaceRoute || spaceSlug) loadFeed(); }, [loadFeed, spaceRoute, spaceSlug, authLoading]);

  const submitPost = async (event) => {
    event.preventDefault();
    if (!user) { window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`; return; }
    const chosenSpace = spaceSlug ? spaces.find((space) => space.slug === spaceSlug)?.id : (selectedSpace || spaces[0]?.id);
    if (!chosenSpace || !body.trim()) return;
    setPosting(true); setError('');
    try {
      const created = await apiRequest('community-posts.php', { method: 'POST', body: jsonBody({ space_id: chosenSpace, body_html: textToHtml(body), embeds: embed ? [embed] : [] }) });
      if (files.length) {
        const form = new FormData(); form.append('post_id', created.id);
        files.forEach((file) => form.append('files[]', file));
        await apiRequest('community-media.php', { method: 'POST', body: form });
      }
      setBody(''); setEmbed(''); setFiles([]); await loadFeed();
    } catch (e) { setError(e.message); }
    finally { setPosting(false); }
  };

  const toggleLike = async (post) => {
    if (!user) { window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`; return; }
    if (!post.is_unlocked) {
      if (post.can_open && window.confirm('Open this post and use one daily unlock before reacting?')) window.location.href = `/community/post?id=${post.id}`;
      return;
    }
    const previous = { ...post };
    setPosts((items) => items.map((item) => item.id === post.id ? { ...item, viewer_liked: !item.viewer_liked, reaction_count: Number(item.reaction_count) + (item.viewer_liked ? -1 : 1) } : item));
    try {
      const result = await apiRequest('community-reactions.php', { method: 'POST', body: jsonBody({ post_id: post.id }) });
      setPosts((items) => items.map((item) => item.id === post.id ? { ...item, viewer_liked: result.liked, reaction_count: result.count } : item));
    } catch (e) { setPosts((items) => items.map((item) => item.id === post.id ? previous : item)); setError(e.message); }
  };

  const wrapSelection = (before, after = before) => {
    const input = bodyInput.current;
    const start = input?.selectionStart ?? body.length;
    const end = input?.selectionEnd ?? body.length;
    const next = body.slice(0, start) + before + body.slice(start, end) + after + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + before.length, end + before.length); });
  };

  const currentSpace = spaces.find((space) => space.slug === spaceSlug);
  const headingTitle = currentSpace?.name || 'All';
  const headingPostCount = currentSpace
    ? Number(currentSpace.post_count || 0)
    : spaces.reduce((total, space) => total + Number(space.post_count || 0), 0);
  const headingPostCountLabel = spaces.length || currentSpace ? ` (${headingPostCount} ${headingPostCount === 1 ? 'post' : 'posts'})` : '';
  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);
  const trendingPosts = [...posts]
    .sort((a, b) => {
      const score = (post) => (Number(post.is_pinned) ? 1000 : 0) + (Number(post.reaction_count) * 3) + (Number(post.comment_count) * 2);
      return score(b) - score(a) || (new Date(b.created_at) - new Date(a.created_at));
    })
    .slice(0, 5);
  const sidebarPostLink = (post) => `/community/post?id=${post.id}`;
  return <>
    <Navbar />
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <h3>Categories</h3>
        <Link className={!spaceSlug ? styles.activeSpace : ''} href="/community">All Categories</Link>
        {spaces.map((space) => <Link className={space.slug === spaceSlug ? styles.activeSpace : ''} href={`/community/space?slug=${encodeURIComponent(space.slug)}`} key={space.id}>
          <span>{space.name}<small>{space.post_count} posts</small></span>
        </Link>)}
        {user?.role === 'admin' && <Link href="/community/admin">Manage community</Link>}
      </aside>

      <section className={styles.feed}>
        <header className={styles.feedHeader}>
          <div><span className="section-label">JhatPatAI Community</span><h1>{headingTitle}{headingPostCountLabel}</h1><p>{currentSpace?.description || 'Ask questions, share wins, and learn with the community.'}</p></div>
          <div className={styles.sort}><button className={sort === 'latest' ? styles.selected : ''} onClick={() => setSort('latest')}>Latest</button><button className={sort === 'popular' ? styles.selected : ''} onClick={() => setSort('popular')}>Popular</button></div>
        </header>

        {allowance?.remaining !== null && allowance?.tier === 'free' && <div className={styles.allowance}><strong>{allowance.remaining}</strong> new posts left today · resets at midnight IST</div>}

        <form className={styles.composer} onSubmit={submitPost}>
          <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase() || '?'}</div>
          <div className={styles.composeBody}>
            <div className={styles.formatBar}><button type="button" onClick={() => wrapSelection('**')}>B</button><button type="button" onClick={() => wrapSelection('_')}>I</button><button type="button" onClick={() => wrapSelection('`')}>{'</>'}</button></div>
            <textarea ref={bodyInput} value={body} onChange={(e) => setBody(e.target.value)} placeholder={user ? 'Share something…' : 'Log in to join the conversation…'} onFocus={() => !user && (window.location.href = '/login?redirect=/community')} maxLength={10000} />
            <div className={styles.composeExtras}>
              {!spaceSlug && <select value={selectedSpace} onChange={(e) => setSelectedSpace(e.target.value)} aria-label="Choose a space"><option value="">Choose space</option>{spaces.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}</select>}
              <input value={embed} onChange={(e) => setEmbed(e.target.value)} placeholder="YouTube or Vimeo URL (optional)" />
              <label>📎 Add media<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.docx,.xlsx,.pptx" onChange={(e) => setFiles(Array.from(e.target.files || []))} /></label>
              <span>{files.length ? `${files.length} selected` : ''}</span>
              <button className="btn btn-primary" disabled={posting || !body.trim()}>{posting ? 'Posting…' : 'Post'}</button>
            </div>
          </div>
        </form>

        {error && <div className={styles.error}>{error}</div>}
        {!loading && !posts.length && <div className={styles.empty}>No posts here yet. Start the conversation.</div>}
        {posts.map((post) => <article className={styles.post} key={post.id}>
          <div className={styles.postMeta}><div className={styles.avatar}>{post.author_name?.[0]}</div><div><strong>{post.author_name}</strong><span> in {post.space_name} · {new Date(post.created_at).toLocaleString()}</span></div>{post.is_pinned == 1 && <b className={styles.pinned}>Pinned</b>}</div>
          <Link onClick={(event) => { if (user && post.can_open && !post.is_unlocked && !window.confirm('Opening this post will use one of today’s free post unlocks. Continue?')) event.preventDefault(); }} href={`/community/post?id=${post.id}`} className={`${styles.excerpt} ${!post.can_open ? styles.locked : ''}`}><p>{post.excerpt}</p>{Number(post.media_count) > 0 && <span>🖼️ {post.media_count} attachment{Number(post.media_count) !== 1 ? 's' : ''}</span>}{user && post.can_open && !post.is_unlocked && <span> · Uses 1 daily unlock</span>}</Link>
          {!post.can_open && <div className={styles.gate}><strong>{post.lock_reason === 'login_required' ? 'Log in to keep reading' : 'Daily free limit reached'}</strong><Link className="btn btn-primary" href={post.lock_reason === 'login_required' ? `/login?redirect=/community/post?id=${post.id}` : '/pricing'}>{post.lock_reason === 'login_required' ? 'Log in free' : 'Upgrade to Pro'}</Link></div>}
          <footer className={styles.postActions}><button className={post.viewer_liked ? styles.liked : ''} onClick={() => toggleLike(post)}>♥ {post.reaction_count}</button><Link href={`/community/post?id=${post.id}`}>💬 {post.comment_count}</Link>{post.comments_locked == 1 && <span>🔒 Comments locked</span>}</footer>
        </article>)}
        {loading && <div className={styles.loading}>Loading community posts…</div>}
        {cursor && !loading && <button className={`btn btn-outline ${styles.loadMore}`} onClick={() => loadFeed(true, cursor)}>Load more</button>}
      </section>

      <aside className={styles.rightRail}>
        <section className={styles.railPanel}>
          <h2>Trending posts</h2>
          {trendingPosts.length ? trendingPosts.map((post) => (
            <Link className={styles.railPost} href={sidebarPostLink(post)} key={`trending-${post.id}`}>
              <strong>{post.excerpt || 'Open post'}</strong>
              <span>{post.space_name} | {post.reaction_count} likes | {post.comment_count} comments</span>
            </Link>
          )) : <p>No trending posts yet.</p>}
        </section>

        <section className={styles.railPanel}>
          <h2>Recent posts</h2>
          {recentPosts.length ? recentPosts.map((post) => (
            <Link className={styles.railPost} href={sidebarPostLink(post)} key={`recent-${post.id}`}>
              <strong>{post.excerpt || 'Open post'}</strong>
              <span>{post.author_name} | {new Date(post.created_at).toLocaleDateString()}</span>
            </Link>
          )) : <p>No recent posts yet.</p>}
        </section>
      </aside>
    </main>
    <Footer />
  </>;
}
