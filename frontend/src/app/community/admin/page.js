'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, jsonBody } from '@/lib/communityApi';
import styles from '@/components/Community.module.css';

export default function CommunityAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [posts, setPosts] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [admin, spaceResult] = await Promise.all([apiRequest('community-admin.php'), apiRequest('community-spaces.php?all=1')]);
      setSettings(admin.settings); setPosts(admin.posts); setSpaces(spaceResult.data);
    } catch (e) { setMessage(e.message); }
  };
  useEffect(() => { if (!authLoading && user?.role === 'admin') load(); }, [authLoading, user]);

  if (!authLoading && user?.role !== 'admin') return <><Navbar /><main className={styles.shell}><section className={styles.feed}><div className={styles.error}>Admin access required.</div><Link href="/community">Return to community</Link></section></main></>;

  const saveSettings = async () => {
    if (!window.confirm('Apply these access limits immediately? Lower limits stop new unlocks for members already over the limit.')) return;
    try { await apiRequest('community-admin.php', { method: 'PUT', body: jsonBody({ settings }) }); setMessage('Access settings saved.'); await load(); }
    catch (e) { setMessage(e.message); }
  };
  const createSpace = async (event) => {
    event.preventDefault();
    try { await apiRequest('community-spaces.php', { method: 'POST', body: jsonBody({ name, description }) }); setName(''); setDescription(''); setMessage('Space created.'); await load(); }
    catch (e) { setMessage(e.message); }
  };
  const archiveSpace = async (id) => { if (window.confirm('Archive this space? Members will no longer be able to post in it.')) { await apiRequest('community-spaces.php', { method: 'DELETE', body: jsonBody({ id }) }); await load(); } };
  const editSpace = async (space) => {
    const updatedName = window.prompt('Space name', space.name);
    if (updatedName === null || !updatedName.trim()) return;
    const updatedDescription = window.prompt('Space description', space.description || '');
    if (updatedDescription === null) return;
    await apiRequest('community-spaces.php', { method: 'PATCH', body: jsonBody({ ...space, name: updatedName, description: updatedDescription }) }); await load();
  };
  const restoreSpace = async (space) => { await apiRequest('community-spaces.php', { method: 'PATCH', body: jsonBody({ ...space, status: 'active' }) }); await load(); };
  const moderate = async (post_id, action) => { await apiRequest('community-admin.php', { method: 'POST', body: jsonBody({ post_id, action }) }); await load(); };
  const changeSetting = (tier, field, value) => setSettings((items) => items.map((item) => item.tier === tier ? { ...item, [field]: value } : item));

  return <><Navbar /><main className={styles.shell}><aside className={styles.sidebar}><Link href="/community">← Community feed</Link><a href="#limits">Access limits</a><a href="#spaces">Spaces</a><a href="#moderation">Moderation</a></aside><section className={styles.feed}><header className={styles.feedHeader}><div><span className="section-label">Administration</span><h1>Community controls</h1><p>Manage feed access, spaces, and published posts.</p></div></header>{message && <div className={styles.allowance}>{message}</div>}
    <div className={styles.adminGrid}><section className={styles.adminCard} id="limits"><h2>Tier limits</h2>{settings.map((item) => <div className={styles.adminRow} key={item.tier}><strong>{item.tier.toUpperCase()}</strong><select value={item.access_mode} onChange={(e) => changeSetting(item.tier, 'access_mode', e.target.value)}><option value="fixed_latest">Newest posts</option>{item.tier !== 'guest' && <option value="daily_unique">Unique posts daily</option>}<option value="unlimited">Unlimited</option></select>{item.access_mode !== 'unlimited' && <input type="number" min="0" value={item.post_limit ?? 0} onChange={(e) => changeSetting(item.tier, 'post_limit', Number(e.target.value))}/>}</div>)}<button className="btn btn-primary" onClick={saveSettings}>Save limits</button></section>
      <section className={styles.adminCard} id="spaces"><h2>Create space</h2><form onSubmit={createSpace}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Space name" required/><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description"/><button className="btn btn-primary">Create space</button></form><h3>Existing spaces</h3>{spaces.map((space) => <div className={styles.adminRow} key={space.id}><strong>{space.name}</strong> · {space.status}<div className={styles.adminActions}><button onClick={() => editSpace(space)}>Edit</button>{space.status === 'archived' ? <button onClick={() => restoreSpace(space)}>Restore</button> : <button className={styles.danger} onClick={() => archiveSpace(space.id)}>Archive</button>}</div></div>)}</section>
    </div>
    <section className={styles.adminCard} id="moderation"><h2>Recent posts</h2>{posts.map((post) => <div className={styles.adminRow} key={post.id}><strong>{post.author_name}</strong> in {post.space_name} · {post.status}<p>{post.excerpt}</p><div className={styles.adminActions}><button onClick={() => moderate(post.id, post.is_pinned == 1 ? 'unpin' : 'pin')}>{post.is_pinned == 1 ? 'Unpin' : 'Pin'}</button><button onClick={() => moderate(post.id, post.comments_locked == 1 ? 'unlock' : 'lock')}>{post.comments_locked == 1 ? 'Unlock' : 'Lock'} comments</button><button onClick={() => moderate(post.id, post.status === 'hidden' ? 'restore' : 'hide')}>{post.status === 'hidden' ? 'Restore' : 'Hide'}</button><button className={styles.danger} onClick={() => moderate(post.id, 'delete')}>Delete</button></div></div>)}</section>
  </section></main></>;
}
