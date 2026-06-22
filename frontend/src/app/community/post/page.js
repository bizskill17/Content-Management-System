'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, jsonBody } from '@/lib/communityApi';
import styles from '@/components/Community.module.css';

const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));

export default function CommunityPostPage() {
  const { user, loading: authLoading } = useAuth();
  const [post, setPost] = useState(null);
  const [gate, setGate] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  const load = async () => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) { setError('Post not found'); setLoading(false); return; }
    setLoading(true); setGate(null);
    try { const result = await apiRequest(`community-post.php?id=${encodeURIComponent(id)}`); setPost(result.data); }
    catch (e) { if (e.status === 403) setGate(e.data); else setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (!authLoading) load(); }, [authLoading]);

  const submitComment = async (event) => {
    event.preventDefault();
    if (!user) { window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`; return; }
    if (!comment.trim()) return;
    try {
      await apiRequest('community-comments.php', { method: 'POST', body: jsonBody({ post_id: post.id, parent_id: replyTo, body_html: `<p>${escapeHtml(comment)}</p>` }) });
      setComment(''); setReplyTo(null); await load();
    } catch (e) { setError(e.message); }
  };

  const toggleLike = async () => {
    if (!user) { window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`; return; }
    try {
      const result = await apiRequest('community-reactions.php', { method: 'POST', body: jsonBody({ post_id: post.id }) });
      setPost((current) => ({ ...current, viewer_liked: result.liked, reaction_count: result.count }));
    } catch (e) { setError(e.message); }
  };
  const editPost = async () => {
    const text = window.prompt('Edit post', post.body_html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
    if (text === null || !text.trim()) return;
    await apiRequest('community-posts.php', { method: 'PATCH', body: jsonBody({ id: post.id, body_html: `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>` }) }); await load();
  };
  const deletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    await apiRequest('community-posts.php', { method: 'DELETE', body: jsonBody({ id: post.id }) }); window.location.href = '/community';
  };
  const editComment = async (item) => {
    const text = window.prompt('Edit comment', item.body_html.replace(/<[^>]+>/g, ''));
    if (text === null || !text.trim()) return;
    await apiRequest('community-comments.php', { method: 'PATCH', body: jsonBody({ id: item.id, body_html: `<p>${escapeHtml(text)}</p>` }) }); await load();
  };
  const deleteComment = async (item) => {
    if (!window.confirm('Delete this comment?')) return;
    await apiRequest('community-comments.php', { method: 'DELETE', body: jsonBody({ id: item.id }) }); await load();
  };

  const roots = post?.comments?.filter((item) => !item.parent_id) || [];
  return <><Navbar /><main className={styles.shell}><aside className={styles.sidebar}><Link href="/community">← Back to feed</Link>{post && <Link href={`/community/space?slug=${post.space_slug}`}>{post.space_icon || '💬'} {post.space_name}</Link>}</aside><section className={styles.feed}>
    {loading && <div className={styles.loading}>Unlocking post…</div>}
    {error && <div className={styles.error}>{error}</div>}
    {gate && <article className={styles.post}><div className={`${styles.excerpt} ${styles.locked}`}><p>{gate.preview}</p></div><div className={styles.gate}><div><strong>{gate.reason === 'login_required' ? 'Log in to read this post' : 'You reached today’s free limit'}</strong><p>{gate.reason === 'daily_limit_reached' ? 'Your allowance resets at midnight IST.' : 'Create a free account to unlock more community posts.'}</p></div><Link className="btn btn-primary" href={gate.reason === 'login_required' ? `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}` : '/pricing'}>{gate.reason === 'login_required' ? 'Log in free' : 'Upgrade to Pro'}</Link></div></article>}
    {post && <article className={styles.post}><div className={styles.postMeta}><div className={styles.avatar}>{post.author_name?.[0]}</div><div><strong>{post.author_name}</strong><span>in {post.space_name} · {new Date(post.created_at).toLocaleString()}</span></div>{post.is_pinned == 1 && <b className={styles.pinned}>Pinned</b>}</div>
      <div className={styles.postContent} dangerouslySetInnerHTML={{ __html: post.body_html }} />
      {!!post.media?.length && <div className={styles.mediaGrid}>{post.media.map((media) => media.media_type === 'image' ? <img key={media.id} src={media.url} alt={media.original_name || 'Post image'} /> : media.media_type === 'embed' ? <iframe key={media.id} src={media.url} title="Video embed" allowFullScreen /> : <a className={styles.document} key={media.id} href={media.url} target="_blank" rel="noreferrer">📄 {media.original_name}</a>)}</div>}
      <footer className={styles.postActions}><button className={post.viewer_liked ? styles.liked : ''} onClick={toggleLike}>♥ {post.reaction_count}</button>{(Number(post.user_id) === Number(user?.id) || user?.role === 'admin') && <><button onClick={editPost}>Edit post</button><button className={styles.danger} onClick={deletePost}>Delete post</button></>}</footer>
      <h3>{post.comments?.length || 0} comments</h3>
      {post.comments_locked == 1 ? <div className={styles.allowance}>Comments are locked for this post.</div> : <form className={styles.commentForm} onSubmit={submitComment}><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={replyTo ? 'Write a reply…' : 'Join the conversation…'} maxLength={3000}/><button className="btn btn-primary">{replyTo ? 'Reply' : 'Comment'}</button>{replyTo && <button type="button" onClick={() => setReplyTo(null)}>Cancel</button>}</form>}
      {roots.map((item) => <div className={styles.comment} key={item.id}><strong>{item.author_name}</strong> <small>{new Date(item.created_at).toLocaleString()}</small><div dangerouslySetInnerHTML={{ __html: item.body_html }} />{post.comments_locked != 1 && <button onClick={() => setReplyTo(item.id)}>Reply</button>}{(Number(item.user_id) === Number(user?.id) || user?.role === 'admin') && <><button onClick={() => editComment(item)}> Edit</button><button className={styles.danger} onClick={() => deleteComment(item)}> Delete</button></>}{post.comments.filter((reply) => Number(reply.parent_id) === Number(item.id)).map((reply) => <div className={styles.reply} key={reply.id}><strong>{reply.author_name}</strong> <small>{new Date(reply.created_at).toLocaleString()}</small><div dangerouslySetInnerHTML={{ __html: reply.body_html }} />{(Number(reply.user_id) === Number(user?.id) || user?.role === 'admin') && <><button onClick={() => editComment(reply)}>Edit</button><button className={styles.danger} onClick={() => deleteComment(reply)}>Delete</button></>}</div>)}</div>)}
    </article>}
  </section></main><Footer /></>;
}
