# 🚨 Guía de Solución de Problemas de Deploy

## Problemas Comunes y Soluciones

### 1. ❌ Error: "Access Denied" o problemas con S3

**Problema**: El bucket S3 "arcadia.mx" no tiene los permisos correctos.

**Solución**:
1. Ve a **AWS S3 Console** → Busca tu bucket "arcadia.mx"
2. Ve a **Permissions** → **Bucket policy**
3. Agrega esta política:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::arcadia.mx/*"
        }
    ]
}
```

4. Ve a **Block Public Access** → Desmarcar "Block all public access"

### 2. ❌ Error: "Identity Pool not found"

**Problema**: El Cognito Identity Pool no existe o tiene permisos incorrectos.

**Solución**:
1. Ve a **AWS Cognito Console** → **Identity Pools**
2. Verifica que el ID `us-east-1:4fc8664a-6d84-43c3-be60-075a17a2662a` existe
3. Ve a **Edit identity pool** → **Unauthenticated role**
4. Asegúrate que tenga esta política:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::arcadia.mx/*"
        }
    ]
}
```

### 3. ❌ Error de Build en AWS Amplify Console

**Problema**: El build falla en AWS Amplify.

**Solución**:
1. Verifica que `amplify.yml` está en la raíz del proyecto ✅
2. Verifica que Node.js version sea 18+ en Amplify Console
3. Ve a **App settings** → **Build settings** → **Edit** → 
   - Build image: `Amazon Linux:2023`
   - Node.js version: `18`

### 4. ❌ Errores de CORS

**Problema**: Errores de CORS al subir imágenes.

**Solución**: En el bucket S3, ve a **Permissions** → **CORS** y agrega:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ]
    }
]
```

## 🔧 Pasos para Deploy Exitoso

### Opción A: AWS Amplify Console (Recomendado)

1. Ve a **AWS Amplify Console**
2. Click **New App** → **Host web app**
3. Conecta tu repositorio de GitHub
4. Branch: `main` o `master`
5. Build settings se detectarán automáticamente
6. Click **Save and deploy**

### Opción B: Deploy Manual

```bash
# 1. Build local
npm run build

# 2. Instalar AWS CLI (si no lo tienes)
# Descargar de: https://aws.amazon.com/cli/

# 3. Deploy a S3 (alternativo)
aws s3 sync build/ s3://tu-bucket-web --delete
```

## 📋 Checklist Pre-Deploy

- ✅ `npm run build` funciona localmente
- ✅ Identity Pool ID es correcto en `aws-exports.js`
- ✅ Bucket S3 existe y tiene permisos públicos
- ✅ CORS configurado en S3
- ✅ Cognito Identity Pool tiene rol con permisos S3
- ✅ `amplify.yml` está en la raíz del proyecto