// aws-exports.js
const awsExports = {
  aws_project_region: "tu-region", // ej: "us-east-1"
  aws_cognito_identity_pool_id: "tu-identity-pool-id", // opcional si usas autenticación
  aws_cognito_region: "tu-region", // opcional
  aws_user_pools_id: "tu-user-pool-id", // opcional
  aws_user_pools_web_client_id: "tu-client-id", // opcional
  aws_appsync_graphqlEndpoint: "", // opcional si usas AppSync
  aws_appsync_region: "", // opcional
  aws_appsync_authenticationType: "", // opcional
  aws_user_files_s3_bucket: "nombre-de-tu-bucket",
  aws_user_files_s3_bucket_region: "tu-region"
};
export default awsExports;