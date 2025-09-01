import React from 'react';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import { LoadingFallback } from './components/LoadingFallback.tsx';
import { useAuth } from './hooks/useAuth.ts';
import { useWorkData } from './hooks/useWorkData.ts';

// Import screens directly to avoid lazy-loading issues at the top level
import LoginScreen from './components/LoginScreen.tsx';
import InitialSetupScreen from './components/InitialSetupScreen.tsx';
import WorkerView from './components/WorkerView.tsx';


const AppContent: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    // Utiliza el hook central de datos de trabajo que maneja la carga de perfiles de forma reactiva
    // FIX: The useWorkData hook expects a 'focusedDate' as the second argument.
    // Providing a default 'new Date()' resolves the type error.
    const { profile, loading: dataLoading } = useWorkData(user, new Date());

    const isLoading = authLoading || dataLoading;

    if (isLoading) {
        return <LoadingFallback />;
    }

    if (!user) {
        return <LoginScreen />;
    }

    if (!profile) {
        // El listener onSnapshot en useWorkData detectará automáticamente
        // cuando se cree el perfil, por lo que onComplete no necesita disparar una recarga manual.
        return <InitialSetupScreen user={user} onComplete={() => {}} />;
    }

    if (profile.role === 'payer') {
        // Existing payers are prompted to set up a new worker profile.
        // This provides a migration path.
        return <InitialSetupScreen user={user} onComplete={() => {}} />;
    }

    // Default to worker view for 'worker' role or any other case
    return <WorkerView user={user} />;
}

const App: React.FC = () => (
    <NotificationProvider>
        {/* The top-level Suspense in index.tsx handles i18n while components load directly. */}
        <AppContent />
    </NotificationProvider>
);

export default App;