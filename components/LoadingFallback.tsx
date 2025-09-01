import React from 'react';

export const LoadingFallback: React.FC = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }} className="dark:bg-slate-900">
        <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            display: 'inline-block',
            borderTop: '4px solid #3b82f6',
            borderRight: '4px solid transparent',
            boxSizing: 'border-box',
            animation: 'rotation 1s linear infinite'
        }} className="dark:border-t-sky-500"></div>
        <style>{`
            @keyframes rotation {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);
