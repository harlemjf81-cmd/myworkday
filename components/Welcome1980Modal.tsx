import React from 'react';
import { useTranslation } from 'react-i18next';

interface Welcome1980ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Welcome1980Modal: React.FC<Welcome1980ModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  const modalStyle: React.CSSProperties = {
    fontFamily: "'VT323', monospace",
    backgroundColor: '#000000',
    color: '#00ff00',
    border: '2px solid #00ff00',
    padding: '2rem',
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 200,
    width: '90%',
    maxWidth: '500px',
  };

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    backdropFilter: 'blur(2px)',
    zIndex: 199,
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#000000',
    color: '#00ff00',
    border: '1px solid #00ff00',
    padding: '0.5rem 1.5rem',
    marginTop: '2rem',
    cursor: 'pointer',
  };

  return (
    <>
        <div style={backdropStyle} onClick={onClose} />
        <div style={modalStyle}>
            <h2 style={{ fontSize: '2rem', textAlign: 'center' }}>
                {t('modals.welcome1980.title')}
            </h2>
            <div style={{ textAlign: 'center' }}>
                <button
                    onClick={onClose}
                    style={buttonStyle}
                    onMouseOver={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#00ff00';
                        (e.currentTarget as HTMLElement).style.color = '#000000';
                    }}
                    onMouseOut={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#000000';
                        (e.currentTarget as HTMLElement).style.color = '#00ff00';
                    }}
                >
                    [ {t('modals.welcome1980.ok')} ]
                </button>
            </div>
        </div>
    </>
  );
};

export default Welcome1980Modal;
