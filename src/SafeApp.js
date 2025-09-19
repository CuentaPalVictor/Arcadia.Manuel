import React, { useState, useEffect, useCallback } from 'react';
import { Amplify } from 'aws-amplify';
import { uploadData, getUrl, remove, list } from 'aws-amplify/storage';
import awsExports from './aws-exports';

// Configurar Amplify con manejo de errores mejorado
try {
  // Usar configuración estándar de Amplify
  Amplify.configure(awsExports);
  console.log('✅ Amplify configured successfully');
  console.log('✅ Identity Pool:', awsExports.aws_cognito_identity_pool_id);
  console.log('✅ S3 Bucket:', awsExports.aws_user_files_s3_bucket);
} catch (error) {
  console.error('❌ Amplify configuration error:', error);
}

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
  
  // Estados para subida de imágenes
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploading, setUploading] = useState(false);

  // Estado para diagnósticos (simplificado)
  const [diagnostics, setDiagnostics] = useState({
    amplifyConfigured: false,
    s3Connection: false,
    lastError: null,
    pinsLoaded: 0
  });

  // Función de diagnóstico mejorada
  const runDiagnostics = async () => {
    console.log('🔍 Iniciando diagnósticos completos...');
    
    const newDiagnostics = {
      amplifyConfigured: false,
      s3Connection: false,
      lastError: null,
      pinsLoaded: 0,
      identityPool: awsExports.aws_cognito_identity_pool_id,
      bucket: awsExports.aws_user_files_s3_bucket,
      region: awsExports.aws_user_files_s3_bucket_region
    };

    try {
      // Test 1: Verificar configuración de Amplify
      console.log('✅ Test 1: Configuración de Amplify');
      console.log('Identity Pool:', newDiagnostics.identityPool);
      console.log('S3 Bucket:', newDiagnostics.bucket);
      console.log('Region:', newDiagnostics.region);
      newDiagnostics.amplifyConfigured = true;

      // Test 2: Probar conexión con S3 listando archivos
      console.log('🔍 Test 2: Probando conexión con S3...');
      
      try {
        const listResult = await list({
          prefix: 'pins/',
          options: {
            accessLevel: 'guest',
            pageSize: 5 // Solo listar 5 para prueba
          }
        });
        
        console.log('✅ Conexión S3 exitosa. Archivos encontrados:', listResult.results?.length || 0);
        console.log('Archivos:', listResult.results);
        newDiagnostics.s3Connection = true;
        
        // Test 3: Intentar cargar base de datos de pins
        console.log('🔍 Test 3: Intentando cargar base de datos de pins...');
        
        try {
          const urlResult = await getUrl({
            key: 'shared/pins-database.json',
            options: {
              accessLevel: 'guest'
            }
          });
          
          console.log('✅ URL obtenida para pins-database.json:', urlResult.url.toString());
          
          const response = await fetch(urlResult.url.toString());
          console.log('Respuesta del fetch:', response.status, response.statusText);
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Base de datos cargada exitosamente:', data.length, 'pins');
            console.log('Pins encontrados:', data);
            newDiagnostics.pinsLoaded = data.length;
            
            // Verificar URLs de imágenes
            console.log('🔍 Test 4: Verificando URLs de imágenes...');
            
            for (const pin of data.slice(0, 3)) { // Solo verificar las primeras 3
              if (pin.src && pin.src.includes('arcadia.mx')) {
                console.log(`🔍 Verificando imagen: ${pin.title}`);
                console.log(`URL: ${pin.src}`);
                
                try {
                  const imgResponse = await fetch(pin.src, { method: 'HEAD' });
                  console.log(`${imgResponse.ok ? '✅' : '❌'} ${pin.title}: ${imgResponse.status}`);
                } catch (imgError) {
                  console.error(`❌ Error verificando ${pin.title}:`, imgError);
                }
              }
            }
            
          } else if (response.status === 404) {
            console.log('ℹ️ No existe base de datos de pins en S3 - esto es normal si es la primera vez');
            newDiagnostics.pinsLoaded = -1; // Indica que no existe pero es normal
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (dbError) {
          console.error('❌ Error cargando base de datos:', dbError);
          newDiagnostics.lastError = dbError.message;
        }
        
      } catch (s3Error) {
        console.error('❌ Error de conexión S3:', s3Error);
        newDiagnostics.s3Connection = false;
        newDiagnostics.lastError = s3Error.message;
      }
      
    } catch (generalError) {
      console.error('❌ Error general en diagnósticos:', generalError);
      newDiagnostics.lastError = generalError.message;
    }
    
    setDiagnostics(newDiagnostics);
    console.log('📋 Diagnósticos completados:', newDiagnostics);
    
    return newDiagnostics;
  };

  // Función para reparar URLs expiradas de imágenes S3
  const repairImageUrls = async () => {
    console.log('🔧 Iniciando reparación de URLs expiradas...');
    
    try {
      const repairedPins = [];
      
      for (const pin of pins) {
        let repairedPin = { ...pin };
        
        // Solo procesar imágenes que parecen ser de S3 y tienen URLs expiradas
        if (pin.src && pin.src.includes('arcadia.mx') && pin.src.includes('X-Amz-Expires')) {
          console.log(`🔧 Reparando URL para: ${pin.title}`);
          
          try {
            // Extraer la key de S3 de la URL
            const urlObj = new URL(pin.src);
            const pathParts = urlObj.pathname.split('/');
            const key = pathParts.slice(1).join('/'); // Remover primer '/' vacío
            
            console.log(`Key extraída: ${key}`);
            
            // Generar nueva URL con expiración de 1 año
            const newUrlResult = await getUrl({
              key: key,
              options: {
                accessLevel: 'guest',
                expiresIn: 3600 * 24 * 365 // 1 año
              }
            });
            
            repairedPin.src = newUrlResult.url.toString();
            console.log(`✅ URL reparada para: ${pin.title}`);
            
          } catch (repairError) {
            console.error(`❌ Error reparando ${pin.title}:`, repairError);
            // Mantener la URL original si falla la reparación
          }
        }
        
        repairedPins.push(repairedPin);
      }
      
      // Actualizar estado con URLs reparadas
      setPins(repairedPins);
      
      // Guardar en S3 y localStorage
      await savePinsToS3(repairedPins);
      
      console.log('✅ Reparación de URLs completada');
      alert('URLs de imágenes reparadas exitosamente');
      
    } catch (error) {
      console.error('❌ Error durante reparación de URLs:', error);
      alert('Error durante la reparación: ' + error.message);
    }
  };

  // Función para forzar recarga completa desde S3
  const forceReloadFromS3 = async () => {
    console.log('🔄 Forzando recarga completa desde S3...');
    
    try {
      // Limpiar cache local
      localStorage.removeItem('arcadia_pins');
      localStorage.removeItem('arcadia_pins_timestamp');
      
      // Intentar cargar desde S3
      const s3Pins = await loadPinsFromS3();
      
      if (s3Pins && s3Pins.length > 0) {
        alert(`✅ Recarga exitosa: ${s3Pins.length} pins cargados desde S3`);
      } else {
        // Si no hay pins en S3, usar datos de muestra
        console.log('ℹ️ No hay pins en S3, usando datos de muestra');
        setPins(samplePins);
        await savePinsToS3(samplePins);
        alert('ℹ️ No se encontraron pins en S3. Se han inicializado con datos de muestra.');
      }
      
      // Ejecutar diagnósticos después de la recarga
      await runDiagnostics();
      
    } catch (error) {
      console.error('❌ Error durante recarga forzada:', error);
      alert('Error durante la recarga: ' + error.message);
    }
  };

  // Función para cargar pins desde S3
  const loadPinsFromS3 = async () => {
    try {
      console.log('🔄 Loading pins from S3...');
      
      const urlResult = await getUrl({
        key: 'shared/pins-database.json',
        options: {
          accessLevel: 'guest'
        }
      });
      
      const response = await fetch(urlResult.url.toString());
      if (response.ok) {
        const s3Pins = await response.json();
        if (Array.isArray(s3Pins) && s3Pins.length > 0) {
          console.log('✅ Loaded pins from S3:', s3Pins.length);
          setPins(s3Pins);
          
          // Guardar en localStorage como cache
          localStorage.setItem('arcadia_pins', JSON.stringify(s3Pins));
          localStorage.setItem('arcadia_pins_timestamp', Date.now().toString());
          
          return s3Pins;
        }
      } else {
        console.log('ℹ️ No pins database found in S3, creating new one');
      }
    } catch (error) {
      console.warn('⚠️ Error loading pins from S3:', error);
    } finally {
      setSyncing(false);
    }
    return null;
  };

  // Función para guardar pins en S3
  const savePinsToS3 = async (pinsToSave) => {
    try {
      console.log('💾 Saving pins to S3...');
      
      const jsonData = JSON.stringify(pinsToSave, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      await uploadData({
        key: 'shared/pins-database.json',
        data: blob,
        options: {
          contentType: 'application/json',
          accessLevel: 'guest'
        }
      }).result;
      
      console.log('✅ Pins saved to S3 successfully');
      
      // Actualizar timestamp en localStorage
      localStorage.setItem('arcadia_pins_timestamp', Date.now().toString());
      
      // Ejecutar limpieza de imágenes huérfanas cada 10 saves
      const saveCount = parseInt(localStorage.getItem('arcadia_save_count') || '0') + 1;
      localStorage.setItem('arcadia_save_count', saveCount.toString());
      
      if (saveCount % 10 === 0) {
        // Ejecutar limpieza en background sin bloquear la UI
        setTimeout(() => cleanupOrphanedS3Images(pinsToSave), 1000);
      }
      
    } catch (error) {
      console.error('❌ Error saving pins to S3:', error);
    }
  };

  // Función para limpiar imágenes huérfanas en S3
  const cleanupOrphanedS3Images = async (currentPins) => {
    try {
      console.log('🧹 Cleaning up orphaned S3 images...');
      
      // Listar todas las imágenes en S3
      const s3Images = await list({
        prefix: 'pins/',
        options: {
          accessLevel: 'guest'
        }
      });
      
      // Obtener URLs de imágenes que están actualmente en uso
      const pinsInUse = currentPins
        .filter(pin => pin.src && pin.src.includes('arcadia.mx'))
        .map(pin => {
          // Extraer la key de S3 de la URL
          const match = pin.src.match(/pins\/[^?]+/);
          return match ? match[0] : null;
        })
        .filter(Boolean);
      
      // Encontrar imágenes huérfanas
      const orphanedImages = s3Images.results?.filter(item => 
        !pinsInUse.includes(item.key)
      ) || [];
      
      if (orphanedImages.length > 0) {
        console.log(`🗑️ Found ${orphanedImages.length} orphaned images in S3`);
        
        // Eliminar imágenes huérfanas (máximo 5 por vez para no sobrecargar)
        const imagesToDelete = orphanedImages.slice(0, 5);
        
        for (const image of imagesToDelete) {
          try {
            await remove({
              key: image.key,
              options: {
                accessLevel: 'guest'
              }
            });
            console.log(`✅ Deleted orphaned image: ${image.key}`);
          } catch (deleteError) {
            console.warn(`⚠️ Failed to delete ${image.key}:`, deleteError);
          }
        }
        
        console.log(`✅ Cleanup complete. Deleted ${imagesToDelete.length} orphaned images.`);
      } else {
        console.log('✅ No orphaned images found in S3');
      }
      
    } catch (error) {
      console.warn('⚠️ Error during S3 cleanup:', error);
    }
  };

  // Inicializar datos con sincronización S3 y diagnósticos
  useEffect(() => {
    console.log('🔄 Initializing SafeApp with S3 sync...');
    
    const initializePins = async () => {
      // Ejecutar diagnósticos primero
      const diagnosticResults = await runDiagnostics();
      
      // Primero intentar cargar desde localStorage (cache rápido)
      let localPins = [];
      let useLocal = false;
      
      try {
        const storedPins = localStorage.getItem('arcadia_pins');
        const timestamp = localStorage.getItem('arcadia_pins_timestamp');
        const cacheAge = Date.now() - parseInt(timestamp || '0');
        const cacheMaxAge = 5 * 60 * 1000; // 5 minutos
        
        if (storedPins && cacheAge < cacheMaxAge) {
          const parsed = JSON.parse(storedPins);
          if (Array.isArray(parsed)) {
            localPins = parsed;
            useLocal = true;
            console.log('✅ Using cached pins from localStorage:', parsed.length);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error reading localStorage cache:', error);
      }

      // Si no hay cache válido o es muy viejo, cargar desde S3
      if (!useLocal) {
        const s3Pins = await loadPinsFromS3();
        if (s3Pins) {
          return; // Ya se actualizó el estado en loadPinsFromS3
        }
        
        // Si no hay datos en S3, usar sample data y guardar
        console.log('✅ Using sample pins (no S3 data)');
        setPins(samplePins);
        await savePinsToS3(samplePins);
      } else {
        setPins(localPins);
        
        // Cargar desde S3 en background para sincronizar
        loadPinsFromS3().then((s3Pins) => {
          if (s3Pins && JSON.stringify(s3Pins) !== JSON.stringify(localPins)) {
            console.log('🔄 Found newer pins in S3, updating...');
          }
        });
      }
      
      setLoading(false);
      console.log('✅ SafeApp initialization complete');
    };

    initializePins();
  }, []);

  // Guardar pins de forma segura (localStorage + S3)
  useEffect(() => {
    if (!loading && pins.length > 0 && !syncing) {
      // Guardar en localStorage inmediatamente (cache rápido)
      try {
        localStorage.setItem('arcadia_pins', JSON.stringify(pins));
      } catch (error) {
        console.warn('Error saving pins to localStorage:', error);
      }
      
      // Guardar en S3 con debounce para evitar demasiadas llamadas
      const timeoutId = setTimeout(() => {
        savePinsToS3(pins);
      }, 2000); // Esperar 2 segundos antes de guardar en S3
      
      return () => clearTimeout(timeoutId);
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

  // Función para manejar selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setUploadFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Sugerir título basado en el nombre del archivo
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setUploadTitle(fileName);
    } else {
      alert('Por favor selecciona un archivo de imagen válido.');
    }
  };

  // Función para comprimir imagen
  const compressImage = (dataUrl, maxWidth = 800) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calcular nuevas dimensiones
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a blob
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      };
      img.src = dataUrl;
    });
  };

  // Función para subir imagen a AWS S3
  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      alert('Por favor completa el título y selecciona una imagen.');
      return;
    }

    setUploading(true);
    
    try {
      // Comprimir imagen
      const compressedBlob = await compressImage(uploadPreview);
      
      // Generar key único para S3
      const timestamp = Date.now();
      const s3Key = `pins/${timestamp}_${uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      console.log('🔼 Iniciando upload a S3 con key:', s3Key);
      console.log('📊 Configuración actual:', {
        identityPoolId: awsExports.aws_cognito_identity_pool_id,
        bucket: awsExports.aws_user_files_s3_bucket,
        region: awsExports.aws_user_files_s3_bucket_region
      });
      
      // Subir a S3 usando AWS Amplify Storage (formato estándar)
      const result = await uploadData({
        key: s3Key,
        data: compressedBlob,
        options: {
          contentType: 'image/jpeg',
          accessLevel: 'guest' // Acceso público sin autenticación
        }
      }).result;
      
      console.log('✅ Upload result:', result);
      
      // Obtener URL pública
      const urlResult = await getUrl({
        key: s3Key,
        options: {
          accessLevel: 'guest',
          expiresIn: 3600 * 24 * 365 // 1 año
        }
      });
      
      console.log('URL result:', urlResult);
      
      // Crear nuevo pin
      const newPin = {
        id: timestamp.toString(),
        src: urlResult.url.toString(),
        title: uploadTitle.trim(),
        author: currentUser.username,
        userId: currentUser.id,
        tags: uploadTags.split(',').map(t => t.trim()).filter(Boolean)
      };
      
      // Agregar pin al estado
      setPins(prevPins => [newPin, ...prevPins]);
      
      // Limpiar formulario
      setUploadFile(null);
      setUploadPreview('');
      setUploadTitle('');
      setUploadTags('');
      setUploadModalOpen(false);
      
      alert('¡Pin subido exitosamente!');
      
    } catch (error) {
      console.error('❌ Error uploading to S3:', error);
      
      // Manejo específico de errores comunes
      let errorMessage = 'Error desconocido';
      if (error.message?.includes('Credentials')) {
        errorMessage = 'Error de credenciales AWS. Verifica que el Identity Pool esté configurado correctamente.';
        console.error('🔑 Verifica en AWS Console:');
        console.error('1. Identity Pool existe:', awsExports.Auth.identityPoolId);
        console.error('2. Permite acceso no autenticado (Unauthenticated access)');
        console.error('3. El rol Unauth tiene permisos para S3');
      } else if (error.message?.includes('Access Denied')) {
        errorMessage = 'Acceso denegado a S3. Verifica permisos del bucket y roles IAM.';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Error de red. Verifica tu conexión a internet.';
      } else {
        errorMessage = error.message || 'Error desconocido';
      }
      
      alert('Error al subir la imagen: ' + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Función para cancelar subida
  const cancelUpload = () => {
    setUploadFile(null);
    setUploadPreview('');
    setUploadTitle('');
    setUploadTags('');
    setUploadModalOpen(false);
  };

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
    <>
      {/* CSS para animaciones */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
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
            {/* Botón de Sincronización */}
            <button 
              onClick={loadPinsFromS3}
              disabled={syncing}
              style={{
                background: syncing ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: syncing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Sincronizar con otros dispositivos"
            >
              {syncing ? (
                <>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid white',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Sync...
                </>
              ) : (
                <>🔄 Sync</>
              )}
            </button>

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
              <i className="fas fa-plus"></i> Crear Pin
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
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>📌 Crear nuevo Pin</h2>
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

            {!uploadFile ? (
              /* File Upload Area */
              <div>
                <div style={{
                  border: '2px dashed #e1e1e1',
                  borderRadius: '12px',
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: '#fafafa',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}><i className="fas fa-image"></i></div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>Selecciona una imagen</h3>
                  <p style={{ color: '#666', marginBottom: '20px' }}>
                    Arrastra y suelta o haz clic para seleccionar
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
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
                <p style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
                  Formatos soportados: JPG, PNG, GIF (máx. 10MB)
                </p>
              </div>
            ) : (
              /* Upload Form */
              <div>
                {/* Preview */}
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
                    <button
                      onClick={() => {
                        setUploadFile(null);
                        setUploadPreview('');
                      }}
                      style={{
                        width: '100%',
                        marginTop: '10px',
                        background: '#f0f0f0',
                        border: 'none',
                        padding: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Cambiar imagen
                    </button>
                  </div>

                  <div style={{ flex: '1', minWidth: '250px' }}>
                    {/* Título */}
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
                        onFocus={(e) => e.target.style.borderColor = '#e60023'}
                        onBlur={(e) => e.target.style.borderColor = '#e1e1e1'}
                      />
                    </div>

                    {/* Tags */}
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
                        onFocus={(e) => e.target.style.borderColor = '#e60023'}
                        onBlur={(e) => e.target.style.borderColor = '#e1e1e1'}
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
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
                        Subiendo...
                      </>
                    ) : (
                      'Crear Pin'
                    )}
                  </button>
                </div>

                {uploading && (
                  <div style={{
                    marginTop: '15px',
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    <i className="fas fa-cloud-upload-alt"></i> Subiendo imagen a AWS S3...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </>
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
            <i className="fas fa-image"></i>
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
          <i className={isSaved ? 'fas fa-heart' : 'far fa-heart'}></i>
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