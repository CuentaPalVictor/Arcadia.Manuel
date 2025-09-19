import React, { useState } from 'react';
import SafeApp from './SafeApp';
import TempUploadApp from './TempUploadApp';

function App() {
  const [useTemp, setUseTemp] = useState(false);
  
  // Selector de versión con estilo
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
        Versión de la app:
      </div>
      <button
        onClick={() => setUseTemp(false)}
        style={{
          background: !useTemp ? '#e60023' : 'white',
          color: !useTemp ? 'white' : '#e60023',
          border: '1px solid #e60023',
          padding: '6px 12px',
          borderRadius: '4px',
          marginRight: '8px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        AWS S3
      </button>
      <button
        onClick={() => setUseTemp(true)}
        style={{
          background: useTemp ? '#28a745' : 'white',
          color: useTemp ? 'white' : '#28a745',
          border: '1px solid #28a745',
          padding: '6px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Temporal
      </button>
    </div>
  );
  
  return (
    <>
      {useTemp ? <TempUploadApp /> : <SafeApp />}
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
        if (e.name === 'QuotaExceededError' && pins.length > 10) {
          try {
            const reducedPins = pins.slice(-10);
            localStorage.setItem('arcadia_pins', JSON.stringify(reducedPins));
            setPins(reducedPins);
          } catch (e2) {
            console.error('Failed to save even with reduced data:', e2);
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