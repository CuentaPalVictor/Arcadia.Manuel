import React from 'react';

function TestApp() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
        🎨 Arcadia Pinterest
      </h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '30px', fontWeight: 'normal' }}>
        ¡Deploy exitoso! 🎉
      </h2>
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '20px', 
        borderRadius: '15px',
        backdropFilter: 'blur(10px)'
      }}>
        <p style={{ fontSize: '1.2rem', marginBottom: '15px' }}>
          ✅ React está funcionando correctamente
        </p>
        <p style={{ fontSize: '1.2rem', marginBottom: '15px' }}>
          ✅ AWS Amplify Deploy exitoso
        </p>
        <p style={{ fontSize: '1.2rem', marginBottom: '15px' }}>
          🚀 Lista para integración completa
        </p>
      </div>
      <div style={{ marginTop: '30px', fontSize: '1rem', opacity: 0.8 }}>
        <p>Versión de prueba - React funcionando en AWS</p>
        <p>Cuenta: CuentaPalVictor/Arcadia.Manuel</p>
      </div>
    </div>
  );
}

export default TestApp;