import React, { useState, useEffect, useCallback } from 'react';

// Datos de muestra seguros
const samplePins = [
  { 
    id: "1", 
    src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400&auto=format&fit=crop", 
    title: "Cocina minimalista", 
    author: "@nora.design", 
    userId: "1", 
    tags: ["hogar", "diseño", "interiores"] 
  },
  { 
    id: "2", 
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=400&auto=format&fit=crop", 
    title: "Montañas al amanecer", 
    author: "@ramiro", 
    userId: "2", 
    tags: ["naturaleza", "viajes"] 
  },
  { 
    id: "3", 
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=400&auto=format&fit=crop", 
    title: "Lago en el bosque", 
    author: "@nora.design", 
    userId: "1", 
    tags: ["naturaleza", "agua", "bosque"] 
  }
];

const sampleUsers = [
  { id: "1", username: "@nora.design", name: "Nora García", savedPins: [] },
  { id: "2", username: "@ramiro", name: "Ramiro Torres", savedPins: [] }
];

function SafeApp() {
  const [pins, setPins] = useState([]);
  const [currentUser, setCurrentUser] = useState(sampleUsers[0]);
  const [query, setQuery] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Inicializar datos de forma segura
  useEffect(() => {
    try {
      const storedPins = localStorage.getItem('arcadia_pins');
      if (storedPins) {
        const parsed = JSON.parse(storedPins);
        if (Array.isArray(parsed)) {
          setPins(parsed);
        } else {
          setPins(samplePins);
        }
      } else {
        setPins(samplePins);
      }
    } catch (error) {
      console.warn('Error loading pins from localStorage:', error);
      setPins(samplePins);
    }
    
    setLoading(false);
  }, []);

  // Guardar pins de forma segura
  useEffect(() => {
    if (!loading && pins.length > 0) {
      try {
        localStorage.setItem('arcadia_pins', JSON.stringify(pins));
      } catch (error) {
        console.warn('Error saving pins to localStorage:', error);
      }
    }
  }, [pins, loading]);

  // Función para guardar pin
  const savePin = useCallback((pinId) => {
    const newSavedPins = currentUser.savedPins.includes(pinId)
      ? currentUser.savedPins.filter(id => id !== pinId)
      : [...currentUser.savedPins, pinId];
    
    const updatedUser = { ...currentUser, savedPins: newSavedPins };
    setCurrentUser(updatedUser);
    
    try {
      localStorage.setItem('arcadia_current_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.warn('Error saving user:', error);
    }
  }, [currentUser]);

  // Filtrar pins de forma segura
  const filteredPins = pins.filter(pin => {
    if (!query) return true;
    
    const searchQuery = query.toLowerCase();
    const title = (pin.title || '').toLowerCase();
    const author = (pin.author || '').toLowerCase();
    const tags = Array.isArray(pin.tags) ? pin.tags.join(' ').toLowerCase() : '';
    
    return title.includes(searchQuery) || 
           author.includes(searchQuery) || 
           tags.includes(searchQuery);
  });

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
          <h2 style={{ color: '#e60023' }}>🎨 Arcadia Pinterest</h2>
          <p>Cargando tu galería...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        padding: '12px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{ 
            fontSize: '1.8rem', 
            color: '#e60023',
            margin: 0,
            fontWeight: 'bold'
          }}>
            📌 Arcadia
          </h1>
          
          <div style={{
            flex: 1,
            maxWidth: '400px',
            margin: '0 20px'
          }}>
            <input
              type="text"
              placeholder="Buscar pins..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '24px',
                border: '2px solid #e1e1e1',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#e60023'}
              onBlur={(e) => e.target.style.borderColor = '#e1e1e1'}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '15px',
            alignItems: 'center'
          }}>
            <button 
              onClick={() => setUploadModalOpen(true)}
              style={{
                background: '#e60023',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '24px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d50920'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#e60023'}
            >
              ➕ Crear Pin
            </button>
            
            <div style={{
              fontSize: '14px',
              color: '#666'
            }}>
              Hola, <strong>{currentUser.name || currentUser.username}</strong>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '30px 20px' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {filteredPins.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#666'
            }}>
              <h3>No se encontraron pins</h3>
              <p>Intenta con una búsqueda diferente o crea tu primer pin</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              {filteredPins.map(pin => (
                <PinCard 
                  key={pin.id}
                  pin={pin}
                  isSaved={currentUser.savedPins.includes(pin.id)}
                  onSave={() => savePin(pin.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>
              🚀 Función de subida
            </h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              La funcionalidad de subida a AWS S3 estará disponible próximamente.
              Por ahora puedes explorar los pins existentes.
            </p>
            <button
              onClick={() => setUploadModalOpen(false)}
              style={{
                background: '#e60023',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '24px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de Pin Card
function PinCard({ pin, isSaved, onSave }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      position: 'relative'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    }}>
      
      {/* Image Container */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {!imageLoaded && (
          <div style={{
            width: '100%',
            height: '200px',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999'
          }}>
            Cargando...
          </div>
        )}
        
        {imageError ? (
          <div style={{
            width: '100%',
            height: '200px',
            backgroundColor: '#f8f8f8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '14px'
          }}>
            🖼️
            <br />
            Imagen no disponible
          </div>
        ) : (
          <img 
            src={pin.src || ''}
            alt={pin.title || 'Pin'}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              display: imageLoaded ? 'block' : 'none'
            }}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        )}
        
        {/* Save Button Overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: isSaved ? '#e60023' : 'rgba(255,255,255,0.9)',
            color: isSaved ? 'white' : '#333',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          {isSaved ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Pin Info */}
      <div style={{ padding: '16px' }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          margin: '0 0 8px 0',
          color: '#333',
          lineHeight: '1.3'
        }}>
          {pin.title || 'Sin título'}
        </h3>
        
        <p style={{
          fontSize: '14px',
          color: '#666',
          margin: '0 0 12px 0'
        }}>
          {pin.author || 'Autor desconocido'}
        </p>
        
        {pin.tags && Array.isArray(pin.tags) && pin.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {pin.tags.slice(0, 3).map((tag, index) => (
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
        )}
      </div>
    </div>
  );
}

export default SafeApp;