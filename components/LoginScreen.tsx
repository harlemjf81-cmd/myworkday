import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase.ts';
import { useNotifications } from '../contexts/NotificationContext.tsx';
import { GoogleIcon } from './icons/GoogleIcon.tsx';

const LoginScreen: React.FC = () => {
    const { t } = useTranslation();
    const { addNotification } = useNotifications();
    const [authError, setAuthError] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        if (!isFirebaseConfigured() || !auth) {
            addNotification(t('login.firebaseNotConfigured'), 'error');
            return;
        }
        setAuthError(null); // Reset error on new attempt
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error: any) {
            console.error("Google Sign-In Error", error);
            if (error.code === 'auth/unauthorized-domain') {
                const domain = window.location.hostname;
                setAuthError(t('login.unauthorizedDomainError', { domain }));
            } else {
                addNotification(`Error: ${error.message}`, 'error');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 z-[200]">
            <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-2xl shadow-2xl text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100">{t('appName')}</h1>
                <p className="text-base text-slate-500 dark:text-slate-400 mt-2 mb-8">{t('login.welcomeMessage')}</p>
                
                {isFirebaseConfigured() ? (
                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                    >
                        <GoogleIcon className="w-6 h-6" />
                        <span className="text-slate-700 dark:text-slate-200 font-semibold">{t('login.signInWithGoogle')}</span>
                    </button>
                ) : (
                     <div>
                        <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
                            {t('login.firebaseNotConfigured')}
                        </div>
                        <p 
                            className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center"
                            dangerouslySetInnerHTML={{ __html: t('login.firebaseNotConfiguredDetails') }}
                        />
                    </div>
                )}
                {authError && (
                    <div className="mt-4 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-sm text-left">
                        <p className="font-bold">{t('login.unauthorizedDomainErrorTitle')}</p>
                        <p className="mt-1" dangerouslySetInnerHTML={{ __html: authError }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;