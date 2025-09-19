import React, { useState, useEffect } from 'react';

function SimpleApp() {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Datos de prueba simples
    const simplePins = [
      {
        id: "1",
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
        title: "Paisaje de montaña",
        author: "@nora.design",
        tags: ["naturaleza", "paisaje"]
      },
      {
        id: "2", 
        src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
        title: "Bosque verde",
        author: "@ramiro",
        tags: ["naturaleza", "bosque"]
      }
    ];
    
    setTimeout(() => {
      setPins(simplePins);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>🎨 Arcadia Pinterest</h2>
          <p>Cargando pins...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '30px',
        padding: '10px 0'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          color: '#e60023',
          margin: 0
        }}>
          📌 Arcadia
        </h1>
        <div style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'center'
        }}>
          <button style={{
            background: '#e60023',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '24px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            ➕ Crear Pin
          </button>
        </div>
      </header>

      {/* Grid de Pins */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '15px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {pins.map(pin => (
          <div 
            key={pin.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
            }}
          >
            <img 
              src={pin.src}
              alt={pin.title}
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
              }}
            />
            <div style={{ padding: '15px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                margin: '0 0 8px 0',
                color: '#333'
              }}>
                {pin.title}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: '0 0 10px 0'
              }}>
                {pin.author}
              </p>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {pin.tags.map((tag, index) => (
                  <span 
                    key={index}
                    style={{
                      background: '#f0f0f0',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#666'
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '50px',
        padding: '20px',
        color: '#999'
      }}>
        <p>✅ Pinterest Clone funcionando correctamente</p>
        <p>🚀 React + AWS Amplify Deploy exitoso</p>
        <small>Version: Simple App - Debug Mode</small>
      </div>
    </div>
  );
}

export default SimpleApp;