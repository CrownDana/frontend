// pages/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { checkAuth } from '../utils/auth';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isAuthenticated = checkAuth();
            if (isAuthenticated) {
                router.replace('/dashboard');
            } else {
                router.replace('/login');
            }
        }
    }, [router]);
    return (
        <>
            <Head>
                <title>CrownDana - Investasi Cerdas</title>
                <meta name="description" content="CrownDana - Investasi Cerdas" />
                <link rel="icon" href="/favicon.png" />
            </Head>
        </>
    );
}