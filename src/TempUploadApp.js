import React, { useState, useEffect, useCallback } from 'react';
import './spinner.css';

// Datos de muestra más extensos
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
  },
  {
    id: "4",
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&auto=format&fit=crop",
    title: "Sendero mágico",
    author: "@ramiro",
    userId: "2",
    tags: ["naturaleza", "camino", "luz"]
  },
  {
    id: "5",
    src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=400&auto=format&fit=crop",
    title: "Bosque encantado",
    author: "@nora.design",
    userId: "1",
    tags: ["bosque", "verde", "naturaleza"]
  },
  {
    id: "6",
    src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=400&auto=format&fit=crop",
    title: "Valle sereno",
    author: "@ramiro",
    userId: "2",
    tags: ["valle", "montañas", "paisaje"]
  }
];

const sampleUsers = [
  { id: "1", username: "@nora.design", name: "Nora García", savedPins: [] },
  { id: "2", username: "@ramiro", name: "Ramiro Torres", savedPins: [] }
];

// Simulador de subida temporal (usando base64 local)
function TempUploadApp() {
  const [pins, setPins] = useState([]);
  const [currentUser, setCurrentUser] = useState(sampleUsers[0]);
  const [query, setQuery] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estados para subida temporal
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploading, setUploading] = useState(false);

  // Inicializar datos
  useEffect(() => {
    try {
      const storedPins = localStorage.getItem('arcadia_pins_temp');
      if (storedPins) {
        const parsed = JSON.parse(storedPins);
        if (Array.isArray(parsed)) {
          setPins([...samplePins, ...parsed]);
        } else {
          setPins(samplePins);
        }
      } else {
        setPins(samplePins);
      }
    } catch (error) {
      console.warn('Error loading pins:', error);
      setPins(samplePins);
    }
    
    setLoading(false);
  }, []);

  // Guardar pins temporales con manejo de errores mejorado
  useEffect(() => {
    if (!loading && pins.length > samplePins.length) {
      try {
        const userPins = pins.filter(pin => !samplePins.find(sp => sp.id === pin.id));
        
        // Calcular tamaño estimado
        const dataSize = JSON.stringify(userPins).length;
        const sizeMB = (dataSize / (1024 * 1024)).toFixed(2);
        
        console.log(`💾 Saving ${userPins.length} pins (${sizeMB} MB) to localStorage`);
        
        localStorage.setItem('arcadia_pins_temp', JSON.stringify(userPins));
        localStorage.setItem('arcadia_pins_temp_count', userPins.length.toString());
        localStorage.setItem('arcadia_pins_temp_size', sizeMB);
        
      } catch (error) {
        console.error('❌ Error saving pins to localStorage:', error);
        
        if (error.name === 'QuotaExceededError') {
          // Alertar al usuario sobre el límite de almacenamiento
          const userPins = pins.filter(pin => !samplePins.find(sp => sp.id === pin.id));
          alert(`⚠️ Límite de almacenamiento alcanzado!\n\nTienes ${userPins.length} imágenes guardadas localmente.\n\nPara guardar más imágenes:\n1. Usa el modo AWS S3\n2. O elimina algunas imágenes locales`);
        }
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
      localStorage.setItem('arcadia_current_user_temp', JSON.stringify(updatedUser));
    } catch (error) {
      console.warn('Error saving user:', error);
    }
  }, [currentUser]);

  // Función para eliminar pin (solo pins locales)
  const deletePin = useCallback((pinId) => {
    const pin = pins.find(p => p.id === pinId);
    if (!pin) return;
    
    // Solo permitir eliminar pins locales (no los de ejemplo)
    if (!samplePins.find(sp => sp.id === pinId)) {
      if (confirm(`¿Seguro que quieres eliminar "${pin.title}"?`)) {
        setPins(prevPins => prevPins.filter(p => p.id !== pinId));
        console.log(`🗑️ Pin eliminado: ${pin.title}`);
      }
    } else {
      alert('No puedes eliminar los pins de ejemplo');
    }
  }, [pins]);

  // Función para manejar archivos (temporal con base64)
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setUploadFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setUploadTitle(fileName);
    } else {
      alert('Por favor selecciona un archivo de imagen válido.');
    }
  };

  // Subida temporal (guarda en localStorage como base64)
  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      alert('Por favor completa el título y selecciona una imagen.');
      return;
    }

    setUploading(true);
    
    // Simular delay de subida
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const timestamp = Date.now();
      
      // Crear nuevo pin con imagen base64 (temporal)
      const newPin = {
        id: timestamp.toString(),
        src: uploadPreview, // Usar base64 temporalmente
        title: uploadTitle.trim(),
        author: currentUser.username,
        userId: currentUser.id,
        tags: uploadTags.split(',').map(t => t.trim()).filter(Boolean),
        isLocal: true // Marcar como imagen local
      };
      
      setPins(prevPins => [newPin, ...prevPins]);
      
      // Limpiar formulario
      setUploadFile(null);
      setUploadPreview('');
      setUploadTitle('');
      setUploadTags('');
      setUploadModalOpen(false);
      
      alert('¡Pin creado exitosamente!\n\nNOTA: Esta imagen se guarda localmente. Para subir a AWS S3, configura tu Cognito Identity Pool.');
      
    } catch (error) {
      console.error('Error creating pin:', error);
      alert('Error al crear el pin: ' + (error.message || 'Error desconocido'));
    } finally {
      setUploading(false);
    }
  };

  // Cancelar subida
  const cancelUpload = () => {
    setUploadFile(null);
    setUploadPreview('');
    setUploadTitle('');
    setUploadTags('');
    setUploadModalOpen(false);
  };

  // Filtrar pins
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
      {/* AWS Warning Banner with Storage Info */}
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        padding: '12px 20px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#856404'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            ⚠️ <strong>Modo Temporal:</strong> Las imágenes se guardan localmente.
          </div>
          
          <div style={{ fontSize: '12px', display: 'flex', gap: '15px' }}>
            <span>📷 Pins locales: {pins.length - samplePins.length}</span>
            <span>💾 Tamaño: {localStorage.getItem('arcadia_pins_temp_size') || '0'} MB</span>
          </div>
          
          <a href="/AWS_SETUP_GUIDE.md" style={{ color: '#e60023', textDecoration: 'underline' }}>
            Configurar AWS S3 →
          </a>
        </div>
      </div>

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
            >
              ➕ Crear Pin
            </button>
            
            <div style={{
              fontSize: '14px',
              color: '#666'
            }}>
              Hola, <strong>{currentUser.name}</strong>
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
                  onDelete={() => deletePin(pin.id)}
                  canDelete={!samplePins.find(sp => sp.id === pin.id)}
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
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>📌 Crear nuevo Pin (Temporal)</h2>
              <button
                onClick={cancelUpload}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#6c757d'
            }}>
              💡 <strong>Modo temporal:</strong> Las imágenes se guardan en tu navegador. Para subir a AWS S3, configura tu Cognito Identity Pool.
            </div>

            {!uploadFile ? (
              <div>
                <div style={{
                  border: '2px dashed #e1e1e1',
                  borderRadius: '12px',
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: '#fafafa',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>Selecciona una imagen</h3>
                  <p style={{ color: '#666', marginBottom: '20px' }}>
                    Arrastra y suelta o haz clic para seleccionar
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="file-upload-temp"
                  />
                  <label
                    htmlFor="file-upload-temp"
                    style={{
                      display: 'inline-block',
                      background: '#e60023',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '24px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    Seleccionar imagen
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  display: 'flex',
                  gap: '20px',
                  marginBottom: '20px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: '0 0 200px' }}>
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: '2px solid #e1e1e1'
                      }}
                    />
                  </div>

                  <div style={{ flex: '1', minWidth: '250px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 'bold',
                        color: '#333'
                      }}>
                        Título *
                      </label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="Dale un título a tu pin"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e1e1e1',
                          borderRadius: '8px',
                          fontSize: '16px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 'bold',
                        color: '#333'
                      }}>
                        Etiquetas
                      </label>
                      <input
                        type="text"
                        value={uploadTags}
                        onChange={(e) => setUploadTags(e.target.value)}
                        placeholder="arte, diseño, inspiración (separadas por comas)"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e1e1e1',
                          borderRadius: '8px',
                          fontSize: '16px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={cancelUpload}
                    disabled={uploading}
                    style={{
                      background: 'white',
                      border: '2px solid #e1e1e1',
                      color: '#666',
                      padding: '12px 24px',
                      borderRadius: '24px',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUploadSubmit}
                    disabled={uploading || !uploadTitle.trim()}
                    style={{
                      background: uploading || !uploadTitle.trim() ? '#ccc' : '#e60023',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '24px',
                      cursor: uploading || !uploadTitle.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {uploading ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid white',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Creando...
                      </>
                    ) : (
                      'Crear Pin'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de Pin Card con opción de eliminar
function PinCard({ pin, isSaved, onSave, onDelete, canDelete }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      position: 'relative'
    }}>
      
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {pin.isLocal && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            zIndex: 2
          }}>
            💻 Local
          </div>
        )}
        
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
            🖼️<br />Imagen no disponible
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
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
          />
        )}
        
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          {isSaved ? '❤️' : '🤍'}
        </button>

        {/* Botón de eliminar para pins locales */}
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(255,255,255,0.9)',
              color: '#dc3545',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#dc3545';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.9)';
              e.target.style.color = '#dc3545';
            }}
          >
            🗑️
          </button>
        )}
      </div>

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

export default TempUploadApp;