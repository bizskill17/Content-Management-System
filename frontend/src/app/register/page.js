'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost/backend/api';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API}/register.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, mobile }),
            });
            const data = await res.json();

            if (data.status === 'success') {
                login(data.user);
                window.location.href = '/courses';
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
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
                        <h1>Create Account</h1>
                        <p>Join JhatPatAI and start mastering AI today.</p>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <form onSubmit={handleSubmit} className={styles.authForm}>
                        <div className={styles.field}>
                            <label>Full Name</label>
                            <input 
                                type="text" 
                                placeholder="John Doe" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                required 
                            />
                        </div>
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
                            <label>Mobile Number (WhatsApp)</label>
                            <input 
                                type="tel" 
                                placeholder="+91 9876543210" 
                                value={mobile} 
                                onChange={(e) => setMobile(e.target.value)} 
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
                            {loading ? 'Creating Account...' : 'Get Started Free'}
                        </button>
                    </form>

                    <p className={styles.authFooter}>
                        Already have an account? <Link href="/login">Log in here</Link>
                    </p>
                </div>
            </div>
        </>
    );
}
