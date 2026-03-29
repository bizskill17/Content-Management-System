'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost/backend/api';

export default function PricingPage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        if (!user) {
            window.location.href = '/login?redirect=/pricing';
            return;
        }

        setLoading(true);
        try {
            // 1. Create Subscription on our backend
            const res = await fetch(`${API}/create-subscription.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user_id: user.id,
                    email: user.email 
                }),
            });
            const data = await res.json();

            if (data.status === 'success') {
                // 2. Open Razorpay Checkout
                const options = {
                    key: data.key_id,
                    subscription_id: data.subscription_id,
                    name: 'JhatPatAI',
                    description: 'Yearly Pro Membership',
                    image: 'https://jhatpatai.bizskilledu.com/logo.png', // Fallback logo
                    handler: function (response) {
                        alert('Payment Successful! Your Pro access will be activated in a few seconds.');
                        window.location.href = '/courses';
                    },
                    prefill: {
                        name: user.name,
                        email: user.email,
                        contact: user.mobile || ''
                    },
                    theme: {
                        color: '#0062ff'
                    }
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                alert('Error creating subscription: ' + data.message);
            }
        } catch (err) {
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className={styles.pricingWrapper}>
                <div className="container">
                    <div className={styles.header}>
                        <h1>Simple, Honest Pricing</h1>
                        <p>Unlock the full power of JhatPatAI and accelerate your learning.</p>
                    </div>

                    <div className={styles.grid}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2>Free Tier</h2>
                                <div className={styles.price}>₹0<span>/forever</span></div>
                            </div>
                            <ul className={styles.features}>
                                <li>Access to all free courses</li>
                                <li>Community Blog access</li>
                                <li>Basic AI Templates</li>
                            </ul>
                            <button className="btn btn-outline" disabled>Current Plan</button>
                        </div>

                        <div className={`${styles.card} ${styles.featured}`}>
                            <div className={styles.badge}>Most Popular</div>
                            <div className={styles.cardHeader}>
                                <h2>Yearly Pro</h2>
                                <div className={styles.price}>₹1,999<span>/year</span></div>
                            </div>
                            <ul className={styles.features}>
                                <li><strong>Full Access</strong> to All Courses</li>
                                <li>Premium Tools & Downloads</li>
                                <li>WhatsApp Automation Masterclass</li>
                                <li>Direct Priority Support</li>
                                <li>Early access to new content</li>
                            </ul>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleSubscribe}
                                disabled={loading || authLoading}
                            >
                                {loading ? 'Processing...' : 'Get All Access Now'}
                            </button>
                            <p className={styles.note}>Secure payment via Razorpay & Google Pay</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Load Razorpay Script */}
            <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        </>
    );
}
