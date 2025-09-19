import React, { useState, useEffect, useCallback, useRef } from 'react';
import SafeApp from './SafeApp';
import TempUploadApp from './TempUploadApp';

function App() {
  // Estados para diferentes modos de la aplicación
  const [appMode, setAppMode] = useState('temp'); // 'temp', 's3', 'reactive'
  
  // Selector de versión con modo reactivo
  const VersionSelector = () => (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      backgroundColor: 'white',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      border: '1px solid #e1e1e1'
    }}>
      <div style={{ fontSize: '14px', marginBottom: '8px', color: '#666' }}>
        Modo de la app:
      </div>
      <button
        onClick={() => setAppMode('s3')}
        style={{
          background: appMode === 's3' ? '#e60023' : 'white',
          color: appMode === 's3' ? 'white' : '#e60023',
          border: '1px solid #e60023',
          padding: '6px 10px',
          borderRadius: '4px',
          marginRight: '6px',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        AWS S3
      </button>
      <button
        onClick={() => setAppMode('temp')}
        style={{
          background: appMode === 'temp' ? '#28a745' : 'white',
          color: appMode === 'temp' ? 'white' : '#28a745',
          border: '1px solid #28a745',
          padding: '6px 10px',
          borderRadius: '4px',
          marginRight: '6px',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Temporal
      </button>
      <button
        onClick={() => setAppMode('reactive')}
        style={{
          background: appMode === 'reactive' ? '#6f42c1' : 'white',
          color: appMode === 'reactive' ? 'white' : '#6f42c1',
          border: '1px solid #6f42c1',
          padding: '6px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        🔄 Reactivo
      </button>
    </div>
  );

  // Renderizar componente según el modo seleccionado
  const renderApp = () => {
    switch (appMode) {
      case 's3':
        return <SafeApp />;
      case 'temp':
        return <TempUploadApp />;
      case 'reactive':
        return <ReactiveGalleryDemo />;
      default:
        return <TempUploadApp />;
    }
  };
  
  return (
    <>
      {renderApp()}
      <VersionSelector />
    </>
  );
}

export default App;

// Datos de muestra
const samplePins = [
  { id: "1", src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop", title: "Cocina minimalista", author: "@nora.design", userId: "1", tags: ["hogar", "diseño", "interiores"] },
  { id: "2", src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop", title: "Montañas al amanecer", author: "@ramiro", userId: "2", tags: ["naturaleza", "viajes"] }
];

// Datos de usuarios de ejemplo
const sampleUsers = [
  { id: "1", username: "@nora.design", name: "Nora García", savedPins: [] },
  { id: "2", username: "@ramiro", name: "Ramiro Torres", savedPins: [] }
];

// Custom hook para manejo de autenticación
function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('arcadia_current_user');
      if (stored) {
        return JSON.parse(stored);
      }
      return sampleUsers[0];
    } catch {
      return sampleUsers[0];
    }
  });

  const [users, setUsers] = useState(() => {
    try {
      const stored = localStorage.getItem('arcadia_users');
      if (stored) {
        return JSON.parse(stored);
      }
      return sampleUsers;
    } catch {
      return sampleUsers;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('arcadia_users', JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('arcadia_current_user', JSON.stringify(currentUser));
    } catch (e) {
      console.error('Error saving current user:', e);
    }
  }, [currentUser]);

  const savePin = useCallback((pinId) => {
    setUsers(prevUsers => {
      const userIndex = prevUsers.findIndex(u => u.id === currentUser.id);
      if (userIndex === -1) return prevUsers;

      const newUsers = [...prevUsers];
      const user = { ...newUsers[userIndex] };
      
      if (user.savedPins.includes(pinId)) {
        user.savedPins = user.savedPins.filter(id => id !== pinId);
      } else {
        user.savedPins = [...user.savedPins, pinId];
      }
      
      newUsers[userIndex] = user;
      setCurrentUser(user);
      return newUsers;
    });
  }, [currentUser]);

  return { currentUser, users, savePin };
}

// Componente para mostrar un pin
function PinCard({ pin, onOpen, onSave, isSaved }) {
  return (
    <div className="card">
      <img 
        src={pin.src} 
        alt={pin.title} 
        onClick={() => onOpen(pin)}
        style={{ width: '100%', display: 'block', borderRadius: '16px' }}
      />
      <div className="card-content">
        <div style={{ fontWeight: 'bold' }}>{pin.title}</div>
        <div>{pin.author}</div>
        <div className="tags">
          {pin.tags.map(t => 
            <span className="tag" key={t}>
              #{t}
            </span>
          )}
        </div>
        <button
          onClick={() => onSave && onSave()}
          className={`btn${isSaved ? ' btn-primary' : ''}`}
          style={{ marginTop: 8, padding: '4px 8px', fontSize: 12 }}
        >
          {isSaved ? 'Guardado' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

// Función para comprimir imágenes
async function compressImage(dataUrl, maxWidth = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = dataUrl;
  });
}

// Componente principal
function App() {
  const [pins, setPins] = useState(() => {
    try {
      const stored = localStorage.getItem('arcadia_pins');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every(pin => 
          pin && typeof pin === 'object' && 
          typeof pin.id === 'string' && 
          typeof pin.src === 'string'
        )) {
          return parsed;
        }
      }
      return samplePins;
    } catch {
      return samplePins;
    }
  });

  const [query, setQuery] = useState('');
  const [page, setPage] = useState('main');
  
  // Hook de autenticación
  const { currentUser, users, savePin } = useAuth();

  // Estados para modal de subida
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadAuthor, setUploadAuthor] = useState('@tú');
  const [uploadTags, setUploadTags] = useState('subido');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadIndex, setUploadIndex] = useState(0);
  const [uploadLarge, setUploadLarge] = useState(false);

  const fileInputRef = useRef(null);

  // Persistir pins en localStorage
  useEffect(() => {
    const savePins = async () => {
      try {
        localStorage.clear();
        const compressedPins = await Promise.all(
          pins.map(async pin => ({
            ...pin,
            src: pin.src.length > 100000 ? await compressImage(pin.src) : pin.src
          }))
        );
        localStorage.setItem('arcadia_pins', JSON.stringify(compressedPins));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
        if (e.name === 'QuotaExceededError') {
          console.warn('⚠️ localStorage quota exceeded. Consider using AWS S3 mode instead of local storage.');
          // En lugar de eliminar pins, solo comprimir más agresivamente
          try {
            const superCompressedPins = await Promise.all(
              pins.map(async pin => ({
                ...pin,
                src: pin.src.length > 50000 ? await compressImage(pin.src, 0.3) : pin.src
              }))
            );
            localStorage.setItem('arcadia_pins', JSON.stringify(superCompressedPins));
            console.log('✅ Saved with aggressive compression');
          } catch (e2) {
            console.error('❌ Failed to save even with super compression:', e2);
            // Como último recurso, avisar al usuario en lugar de eliminar datos
            alert('Memoria local llena. Por favor usa el modo AWS S3 para guardar más imágenes.');
          }
        }
      }
    };
    savePins();
  }, [pins]);

  // Filtrar pins
  const filtered = pins.filter(pin => 
    pin.title.toLowerCase().includes(query.toLowerCase()) ||
    pin.author.toLowerCase().includes(query.toLowerCase()) ||
    pin.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
  );

  // Función para manejar clicks en pins
  function handlePinClick(pin) {
    console.log('Pin clicked:', pin);
  }

  // Subir imagen usando AWS S3
  const onUpload = async (files) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const readers = list.map(f => new Promise(res => {
      const r = new FileReader();
      r.onload = () => res({ file: f, src: r.result });
      r.readAsDataURL(f);
    }));
    
    try {
      const results = await Promise.all(readers);
      setUploadFiles(results);
      setUploadIndex(0);
      setUploadPreview(results[0].src);
      setUploadFile(results[0].file);
      setUploadTitle(results[0].file.name.replace(/\.[^.]+$/, ''));
      setUploadAuthor(currentUser.username);
      setUploadTags('subido');
      setUploadModalOpen(true);
    } catch (error) {
      console.error('Error reading files:', error);
    }
  };

  // Guardar imagen actual en AWS S3
  async function saveCurrent() {
    if (!uploadPreview || !uploadFile) return;
    
    try {
      // Subir a S3 usando nueva API
      const s3Key = `pins/${Date.now()}_${uploadFile.name}`;
      
      const result = await uploadData({
        key: s3Key,
        data: uploadFile,
        options: {
          contentType: uploadFile.type,
          accessLevel: 'guest'
        }
      });
      
      // Obtener URL pública
      const urlResult = await getUrl({
        key: s3Key,
        options: {
          accessLevel: 'guest'
        }
      });
      
      const id = String(Date.now());
      const newPin = {
        id,
        src: urlResult.url.toString(),
        title: uploadTitle || uploadFile.name.replace(/\.[^.]+$/, ''),
        author: currentUser.username,
        userId: currentUser.id,
        tags: (uploadTags || 'subido').split(',').map(t => t.trim()).filter(Boolean)
      };
      
      setPins(p => [newPin, ...p]);
      
      // Remover de uploadFiles y pasar al siguiente
      const remaining = uploadFiles.slice();
      remaining.splice(uploadIndex, 1);
      setUploadFiles(remaining);
      if (remaining.length > 0) {
        showIndex(uploadIndex % remaining.length);
      } else {
        cancelUpload();
      }
    } catch (err) {
      console.error("Error uploading to S3:", err);
      alert("Error al subir la imagen a AWS S3: " + err.message);
    }
  }

  function showIndex(i) {
    if (!uploadFiles || uploadFiles.length === 0) return;
    const idx = (i + uploadFiles.length) % uploadFiles.length;
    setUploadIndex(idx);
    setUploadPreview(uploadFiles[idx].src);
    setUploadFile(uploadFiles[idx].file);
    setUploadTitle(uploadFiles[idx].file.name.replace(/\.[^.]+$/, ''));
    setUploadLarge(false);
  }

  function nextImage() { showIndex(uploadIndex + 1); }
  function prevImage() { showIndex(uploadIndex - 1); }

  function cancelUpload() {
    setUploadModalOpen(false);
    setUploadPreview(null);
    setUploadFile(null);
    setUploadTitle('');
    setUploadAuthor('@tú');
    setUploadTags('subido');
    if (fileInputRef.current) fileInputRef.current.value = null;
  }

  // ESC closes modal
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && uploadModalOpen) cancelUpload();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [uploadModalOpen]);

  return (
    <div>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px' }}>
          <span style={{ fontWeight: 'bold', fontSize: 20, marginRight: 16 }}>
            Arcadia
          </span>
          <input
            className="search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca ideas, recetas, lugares..."
          />
        </div>
      </div>
      
      <div className="container">
        <div className="masonry">
          {filtered.map(pin =>
            <PinCard
              pin={pin}
              key={pin.id}
              onOpen={() => handlePinClick(pin)}
              onSave={() => savePin(pin.id)}
              isSaved={currentUser.savedPins.includes(pin.id)}
            />
          )}
        </div>
      </div>
      
      <div className="footer">AWS Las ingenieras TecMilenio.</div>
      
      {/* Input file oculto */}
      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => onUpload(e.target.files)}
      />
      
      {/* Floating action button */}
      <button
        className="fab"
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        title="Subir imagen"
      >
        +
      </button>
      
      {/* Modal de subida */}
      {uploadModalOpen && (
        <div className="modal-bg">
          <div className="upload-form">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0 }}>Subir imagen</h3>
                  {uploadFiles && uploadFiles.length > 1 && (
                    <span style={{ fontSize: 12, color: '#666' }}>
                      {uploadIndex + 1}/{uploadFiles.length}
                    </span>
                  )}
                </div>
                <button className="close" onClick={cancelUpload}>×</button>
              </div>
              
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12 }}>
                <div>
                  {uploadPreview && (
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={uploadPreview} 
                        className="upload-preview" 
                        alt="preview" 
                        onClick={() => setUploadLarge(l => !l)} 
                        style={uploadLarge ? { maxHeight: '90vh' } : {}} 
                      />
                    </div>
                  )}
                  
                  {uploadFiles && uploadFiles.length > 1 && (
                    <div className="thumbs">
                      {uploadFiles.map((it, i) => (
                        <img 
                          key={i} 
                          src={it.src} 
                          className={`thumb${i === uploadIndex ? ' active' : ''}`} 
                          onClick={() => showIndex(i)} 
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label>Título</label>
                  <input 
                    type="text" 
                    value={uploadTitle} 
                    onChange={(e) => setUploadTitle(e.target.value)} 
                  />
                  
                  <label style={{ marginTop: 8, display: 'block' }}>Autor</label>
                  <input 
                    type="text" 
                    value={uploadAuthor} 
                    onChange={(e) => setUploadAuthor(e.target.value)} 
                  />
                  
                  <label style={{ marginTop: 8, display: 'block' }}>Tags (separadas por comas)</label>
                  <input 
                    type="text" 
                    value={uploadTags} 
                    onChange={(e) => setUploadTags(e.target.value)} 
                  />
                  
                  <div className="form-actions">
                    <div style={{ marginRight: 'auto', display: 'flex', gap: 6 }}>
                      <button className="btn" onClick={prevImage} title="Anterior">◀</button>
                      <button className="btn" onClick={nextImage} title="Siguiente">▶</button>
                    </div>
                    <div>
                      <button 
                        className="btn" 
                        onClick={() => setUploadLarge(l => !l)} 
                        style={{ marginRight: 6 }}
                      >
                        {uploadLarge ? 'Ver menos' : 'Ver más'}
                      </button>
                      <button 
                        className="btn-primary" 
                        onClick={saveCurrent} 
                        style={{ marginRight: 6 }}
                      >
                        Guardar
                      </button>
                      <button 
                        className="btn" 
                        onClick={cancelUpload} 
                        style={{ background: '#eee', color: '#333' }}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook personalizado para carga reactiva de imágenes
function useReactiveImageLoader(pins, options = {}) {
  const {
    batchSize = 6,           // Cargar 6 imágenes por lote
    loadDelay = 200,         // Delay entre lotes (ms)
    preloadNext = 3,         // Precargar siguientes 3 imágenes
    enableCache = true,      // Habilitar cache
    retryAttempts = 3        // Intentos de reintento
  } = options;

  const [loadedImages, setLoadedImages] = useState(new Set());
  const [loadingImages, setLoadingImages] = useState(new Set());
  const [failedImages, setFailedImages] = useState(new Set());
  const [currentBatch, setCurrentBatch] = useState(0);
  const [imageCache, setImageCache] = useState(new Map());
  
  // Cache para retries
  const [retryCount, setRetryCount] = useState(new Map());

  // Función para precargar una imagen
  const preloadImage = useCallback((src, pinId) => {
    return new Promise((resolve, reject) => {
      // Verificar cache primero
      if (enableCache && imageCache.has(src)) {
        resolve(imageCache.get(src));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous'; // Para evitar problemas de CORS
      
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout loading image: ${src}`));
      }, 10000); // 10 segundos timeout

      img.onload = () => {
        clearTimeout(timeout);
        const imageData = {
          src,
          pinId,
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          loaded: true,
          timestamp: Date.now()
        };
        
        // Guardar en cache
        if (enableCache) {
          setImageCache(prev => new Map(prev.set(src, imageData)));
        }
        
        resolve(imageData);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  }, [imageCache, enableCache]);

  // Función para cargar un lote de imágenes
  const loadBatch = useCallback(async (batchIndex) => {
    const startIndex = batchIndex * batchSize;
    const endIndex = Math.min(startIndex + batchSize, pins.length);
    const batch = pins.slice(startIndex, endIndex);

    console.log(`🔄 Loading batch ${batchIndex + 1}: images ${startIndex + 1}-${endIndex}`);

    const batchPromises = batch.map(async (pin) => {
      const pinId = pin.id;
      const src = pin.src;

      // Skip if already loaded or loading
      if (loadedImages.has(pinId) || loadingImages.has(pinId)) {
        return null;
      }

      // Marcar como loading
      setLoadingImages(prev => new Set([...prev, pinId]));

      try {
        const imageData = await preloadImage(src, pinId);
        
        // Marcar como loaded
        setLoadedImages(prev => new Set([...prev, pinId]));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(pinId);
          return newSet;
        });
        
        return imageData;
        
      } catch (error) {
        console.warn(`⚠️ Failed to load image for pin ${pinId}:`, error);
        
        // Manejar reintentos
        const currentRetries = retryCount.get(pinId) || 0;
        if (currentRetries < retryAttempts) {
          setRetryCount(prev => new Map(prev.set(pinId, currentRetries + 1)));
          
          // Retry después de un delay
          setTimeout(() => {
            setLoadingImages(prev => {
              const newSet = new Set(prev);
              newSet.delete(pinId);
              return newSet;
            });
          }, 1000 * (currentRetries + 1));
          
        } else {
          // Marcar como failed después de todos los reintentos
          setFailedImages(prev => new Set([...prev, pinId]));
          setLoadingImages(prev => {
            const newSet = new Set(prev);
            newSet.delete(pinId);
            return newSet;
          });
        }
        
        return null;
      }
    });

    // Esperar que termine el lote actual
    const results = await Promise.allSettled(batchPromises);
    
    // Log de resultados
    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    console.log(`✅ Batch ${batchIndex + 1} completed: ${successful}/${batch.length} images loaded`);
    
    return results;
  }, [pins, batchSize, loadedImages, loadingImages, preloadImage, retryCount, retryAttempts]);

  // Efecto principal para cargar imágenes por lotes
  useEffect(() => {
    if (!pins || pins.length === 0) return;

    const totalBatches = Math.ceil(pins.length / batchSize);
    
    const loadNextBatch = async () => {
      if (currentBatch < totalBatches) {
        await loadBatch(currentBatch);
        
        // Delay antes del siguiente lote
        setTimeout(() => {
          setCurrentBatch(prev => prev + 1);
        }, loadDelay);
      }
    };

    loadNextBatch();
  }, [pins, currentBatch, loadBatch, batchSize, loadDelay]);

  // Efecto para precargar imágenes siguientes
  useEffect(() => {
    if (preloadNext > 0 && pins && pins.length > 0) {
      const preloadNextImages = async () => {
        const loadedCount = loadedImages.size;
        const nextImages = pins.slice(loadedCount, loadedCount + preloadNext);
        
        nextImages.forEach(pin => {
          if (!loadedImages.has(pin.id) && !loadingImages.has(pin.id)) {
            preloadImage(pin.src, pin.id).catch(() => {
              // Silently handle preload errors
            });
          }
        });
      };

      preloadNextImages();
    }
  }, [pins, loadedImages, loadingImages, preloadNext, preloadImage]);

  // Función para reiniciar la carga
  const resetLoader = useCallback(() => {
    setLoadedImages(new Set());
    setLoadingImages(new Set());
    setFailedImages(new Set());
    setCurrentBatch(0);
    setRetryCount(new Map());
    if (enableCache) {
      setImageCache(new Map());
    }
  }, [enableCache]);

  // Función para forzar recarga de una imagen específica
  const retryImage = useCallback((pinId) => {
    const pin = pins.find(p => p.id === pinId);
    if (pin) {
      setFailedImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(pinId);
        return newSet;
      });
      setRetryCount(prev => {
        const newMap = new Map(prev);
        newMap.delete(pinId);
        return newMap;
      });
      
      preloadImage(pin.src, pinId).then(() => {
        setLoadedImages(prev => new Set([...prev, pinId]));
      }).catch(() => {
        setFailedImages(prev => new Set([...prev, pinId]));
      });
    }
  }, [pins, preloadImage]);

  // Estadísticas
  const stats = {
    total: pins?.length || 0,
    loaded: loadedImages.size,
    loading: loadingImages.size,
    failed: failedImages.size,
    cached: imageCache.size,
    progress: pins?.length ? (loadedImages.size / pins.length) * 100 : 0
  };

  return {
    loadedImages,
    loadingImages,
    failedImages,
    imageCache,
    stats,
    resetLoader,
    retryImage,
    isImageLoaded: (pinId) => loadedImages.has(pinId),
    isImageLoading: (pinId) => loadingImages.has(pinId),
    isImageFailed: (pinId) => failedImages.has(pinId),
    getImageData: (src) => imageCache.get(src)
  };
}

// Hook para Lazy Loading con Intersection Observer
function useLazyLoading(threshold = 0.1, rootMargin = '50px') {
  const [visibleElements, setVisibleElements] = useState(new Set());
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleElements(prev => new Set([...prev, entry.target.dataset.pinId]));
            // Una vez visible, dejar de observar
            observerRef.current.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin]);

  const observe = useCallback((element, pinId) => {
    if (element && observerRef.current && !visibleElements.has(pinId)) {
      element.dataset.pinId = pinId;
      observerRef.current.observe(element);
    }
  }, [visibleElements]);

  return {
    observe,
    isVisible: (pinId) => visibleElements.has(pinId),
    visibleCount: visibleElements.size
  };
}

// Componente ReactiveImageCard con carga optimizada
function ReactiveImageCard({ 
  pin, 
  imageLoader, 
  lazyLoader, 
  onLoad, 
  onError, 
  className = "",
  showLoadingStats = false 
}) {
  const [imageRef, setImageRef] = useState(null);
  const [showImage, setShowImage] = useState(false);

  // Observer para lazy loading
  useEffect(() => {
    if (imageRef && pin.id) {
      lazyLoader.observe(imageRef, pin.id);
    }
  }, [imageRef, pin.id, lazyLoader]);

  // Mostrar imagen cuando sea visible
  useEffect(() => {
    if (lazyLoader.isVisible(pin.id)) {
      setShowImage(true);
    }
  }, [lazyLoader, pin.id]);

  const isLoaded = imageLoader.isImageLoaded(pin.id);
  const isLoading = imageLoader.isImageLoading(pin.id);
  const isFailed = imageLoader.isImageFailed(pin.id);
  const imageData = imageLoader.getImageData(pin.src);

  const handleImageLoad = () => {
    onLoad?.(pin.id, imageData);
  };

  const handleImageError = () => {
    onError?.(pin.id);
  };

  const handleRetry = () => {
    imageLoader.retryImage(pin.id);
  };

  return (
    <div
      ref={setImageRef}
      className={`reactive-image-card ${className}`}
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Área de imagen */}
      <div style={{
        position: 'relative',
        height: '200px',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {!showImage ? (
          // Placeholder antes de ser visible
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            color: '#666'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e1e1e1',
              borderTop: '3px solid #e60023',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ fontSize: '12px' }}>Preparando...</span>
          </div>
        ) : isLoading ? (
          // Loading state
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            color: '#666'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e1e1e1',
              borderTop: '3px solid #e60023',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ fontSize: '12px' }}>Cargando imagen...</span>
          </div>
        ) : isFailed ? (
          // Error state con retry
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            color: '#dc3545'
          }}>
            <div style={{ fontSize: '24px' }}>⚠️</div>
            <span style={{ fontSize: '12px', textAlign: 'center' }}>
              Error al cargar
            </span>
            <button
              onClick={handleRetry}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Reintentar
            </button>
          </div>
        ) : isLoaded ? (
          // Imagen cargada
          <img
            src={pin.src}
            alt={pin.title || 'Pin'}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'opacity 0.3s ease'
            }}
          />
        ) : null}

        {/* Stats overlay (opcional) */}
        {showLoadingStats && (
          <div style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px'
          }}>
            {isLoaded ? '✅' : isLoading ? '⏳' : isFailed ? '❌' : '⏸️'}
          </div>
        )}
      </div>

      {/* Información del pin */}
      <div style={{ padding: '12px' }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          margin: '0 0 4px 0',
          color: '#333',
          lineHeight: '1.3'
        }}>
          {pin.title || 'Sin título'}
        </h3>
        
        <p style={{
          fontSize: '12px',
          color: '#666',
          margin: '0 0 8px 0'
        }}>
          {pin.author || 'Autor desconocido'}
        </p>
        
        {pin.tags && Array.isArray(pin.tags) && pin.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {pin.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                style={{
                  background: '#f0f0f0',
                  color: '#666',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '10px'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de demostración con carga reactiva completa
function ReactiveGalleryDemo() {
  // Datos de ejemplo más extensos para demostrar el sistema
  const samplePins = [
    { id: "1", src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400", title: "Cocina moderna", author: "@designer1", tags: ["diseño", "cocina", "moderno"] },
    { id: "2", src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=400", title: "Montañas", author: "@nature_lover", tags: ["naturaleza", "montaña"] },
    { id: "3", src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=400", title: "Lago sereno", author: "@photographer", tags: ["agua", "paisaje"] },
    { id: "4", src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400", title: "Bosque mágico", author: "@forest_explorer", tags: ["bosque", "naturaleza"] },
    { id: "5", src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=400", title: "Sendero verde", author: "@hiker", tags: ["sendero", "verde"] },
    { id: "6", src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=400", title: "Valle dorado", author: "@landscape_pro", tags: ["valle", "dorado"] },
    { id: "7", src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=400", title: "Reflexiones", author: "@water_artist", tags: ["reflexión", "agua"] },
    { id: "8", src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400", title: "Luz filtrada", author: "@light_catcher", tags: ["luz", "bosque"] }
  ];

  // Hooks del sistema reactivo
  const imageLoader = useReactiveImageLoader(samplePins, {
    batchSize: 4,
    loadDelay: 300,
    preloadNext: 2,
    retryAttempts: 3
  });

  const lazyLoader = useLazyLoading(0.1, '100px');

  // Estados para la demo
  const [showStats, setShowStats] = useState(true);

  const handleImageLoad = (pinId, imageData) => {
    console.log(`✅ Image loaded for pin ${pinId}:`, imageData);
  };

  const handleImageError = (pinId) => {
    console.error(`❌ Failed to load image for pin ${pinId}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header con estadísticas */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h1 style={{
            fontSize: '24px',
            color: '#e60023',
            margin: 0
          }}>
            🔄 Sistema de Carga Reactiva de Imágenes
          </h1>
          
          <button
            onClick={() => setShowStats(!showStats)}
            style={{
              background: showStats ? '#e60023' : '#f0f0f0',
              color: showStats ? 'white' : '#666',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {showStats ? 'Ocultar' : 'Mostrar'} Stats
          </button>
        </div>

        {showStats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {imageLoader.stats.loaded}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Cargadas</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                {imageLoader.stats.loading}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Cargando</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                {imageLoader.stats.failed}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Fallidas</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>
                {imageLoader.stats.cached}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>En Cache</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
                {lazyLoader.visibleCount}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Visibles</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e60023' }}>
                {Math.round(imageLoader.stats.progress)}%
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Progreso</div>
            </div>
          </div>
        )}

        <div style={{
          marginTop: '16px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={imageLoader.resetLoader}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Reiniciar Carga
          </button>
          
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#e9ecef',
            borderRadius: '20px',
            fontSize: '14px',
            color: '#495057'
          }}>
            ℹ️ Las imágenes se cargan automáticamente por lotes y se optimizan con lazy loading
          </div>
        </div>
      </div>

      {/* Grid de imágenes reactivas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {samplePins.map(pin => (
          <ReactiveImageCard
            key={pin.id}
            pin={pin}
            imageLoader={imageLoader}
            lazyLoader={lazyLoader}
            onLoad={handleImageLoad}
            onError={handleImageError}
            showLoadingStats={true}
          />
        ))}
      </div>

      {/* Información adicional */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#fff3cd',
        borderRadius: '12px',
        border: '1px solid #ffeaa7'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#856404' }}>
          🚀 Características del Sistema:
        </h3>
        <ul style={{ color: '#856404', paddingLeft: '20px' }}>
          <li><strong>Carga por lotes:</strong> Las imágenes se cargan en grupos para optimizar el rendimiento</li>
          <li><strong>Lazy Loading:</strong> Solo carga imágenes cuando están visibles en el viewport</li>
          <li><strong>Cache inteligente:</strong> Las imágenes cargadas se mantienen en memoria para acceso rápido</li>
          <li><strong>Reintentos automáticos:</strong> Sistema de retry para imágenes que fallan al cargar</li>
          <li><strong>Precarga:</strong> Carga anticipada de las siguientes imágenes</li>
          <li><strong>Estadísticas en tiempo real:</strong> Monitoreo completo del estado de carga</li>
        </ul>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .reactive-image-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
}