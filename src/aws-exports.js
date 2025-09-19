const awsExports = {
  Auth: {
    region: "us-east-1",
    identityPoolId: "us-east-1:e811d0ae-1685-4f0a-9e93-fcfc78c8c739" // ✅ Identity Pool ID real
  },
  Storage: {
    S3: {
      bucket: "arcadia.mx",
      region: "us-east-1"
    }
  }
};

// Debug: Verificar configuración
console.log('AWS Configuration:', awsExports);

export default awsExports;