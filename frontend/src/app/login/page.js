'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import styles from '../register/page.module.css'; // Reuse register styles
import { apiRequest } from '@/lib/communityApi';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost/backend/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await apiRequest('login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (data.status === 'success') {
                login(data.user, data.csrf_token);
                const redirect = new URLSearchParams(window.location.search).get('redirect');
                window.location.href = redirect && redirect.startsWith('/') ? redirect : '/community';
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className={styles.authWrapper}>
                <div className={styles.authCard}>
                    <div className={styles.authHeader}>
                        <h1>Welcome Back</h1>
                        <p>Sign in to continue your learning journey.</p>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <form onSubmit={handleSubmit} className={styles.authForm}>
                        <div className={styles.field}>
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                placeholder="name@company.com" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Password</label>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Logging in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className={styles.authFooter}>
                        Don't have an account? <Link href="/register">Register for free</Link>
                    </p>
                </div>
            </div>
        </>
    );
}
