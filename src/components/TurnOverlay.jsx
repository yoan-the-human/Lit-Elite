import React from 'react';

export default function TurnOverlay({ activePlayerName, onConfirmReady, language = 'en' }) {
  const isBg = language === 'bg';
  return (
    <div className="turn-handoff-screen">
      <div style={{
        padding: '40px',
        maxWidth: '500px',
        textAlign: 'center',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
        }}>
          👤
        </div>
        
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>
            {isBg ? 'Предайте устройството' : 'Pass the Device'}
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '1rem', lineHeight: '1.6' }}>
            {isBg ? 'Моля, предайте контрола на:' : 'Please hand the controls over to:'}
          </p>
          <h3 style={{ 
            fontSize: '1.75rem', 
            fontWeight: '800', 
            color: '#a855f7', 
            textShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
            marginTop: '8px'
          }}>
            {activePlayerName}
          </h3>
        </div>

        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          {isBg ? 'Опонентът трябва да гледа настрани от екрана, преди да се натисне бутонът за разкриване на ръката.' : 'Opponent should look away from the screen before clicking the button below to reveal the hand.'}
        </p>

        <button 
          className="btn-premium btn-spades" 
          onClick={onConfirmReady}
          style={{ fontSize: '1.1rem', padding: '12px 32px', width: '100%' }}
        >
          {isBg ? 'Готов съм!' : 'I Am Ready!'}
        </button>
      </div>
    </div>
  );
}
