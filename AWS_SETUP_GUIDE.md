# 🔧 Configurar AWS Cognito Identity Pool para Arcadia Pinterest

## Paso 1: Crear Identity Pool

1. **Ir a AWS Console** → https://console.aws.amazon.com/cognito/
2. **Click "Identity pools"** → **"Create identity pool"**
3. **Configurar Identity Pool:**
   ```
   Identity pool name: ArcadiaIdentityPool
   Enable access to unauthenticated identities: ✅ CHECKED
   Authentication providers: (dejar vacío por ahora)
   ```
4. **Click "Create pool"**

## Paso 2: Configurar Roles IAM

### Para el Unauth Role (usuarios no autenticados):
1. **Se creará automáticamente** un rol como `Cognito_ArcadiaIdentityPool_Unauth_Role`
2. **Ir a IAM Console** → **Roles** → Buscar el rol creado
3. **Attach policy** → **Add inline policy**
4. **Pegar esta policy JSON:**

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
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::arcadia.mx"
        }
    ]
}
```

5. **Nombre de policy**: `ArcadiaS3Access`
6. **Create policy**

## Paso 3: Configurar S3 Bucket

### CORS Configuration:
1. **Ir a S3 Console** → **Bucket "arcadia.mx"**
2. **Permissions** → **CORS**
3. **Pegar esta configuración:**

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
        ],
        "MaxAgeSeconds": 3000
    }
]
```

### Bucket Policy:
1. **Permissions** → **Bucket policy**
2. **Pegar esta policy:**

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

### Public Access:
1. **Permissions** → **Block public access**
2. **Uncheck "Block all public access"**
3. **Confirm**

## Paso 4: Obtener Identity Pool ID

1. **En Cognito Identity Pool** → **Dashboard**
2. **Copiar el Identity Pool ID** (formato: `us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. **Actualizar aws-exports.js** con el ID real

## Verificación Rápida:

```bash
# Test con AWS CLI (opcional)
aws cognito-identity get-identity-pool-configuration --identity-pool-id YOUR_POOL_ID
```

## ⚠️ Alternativa Rápida:

Si no quieres configurar todo manualmente, puedes usar **AWS Amplify CLI**:

```bash
npm install -g @aws-amplify/cli
amplify init
amplify add storage
amplify push
```

Esto generará automáticamente el `aws-exports.js` con todas las configuraciones correctas.