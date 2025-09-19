const awsExports = {
  aws_project_region: "us-east-1",
  aws_user_files_s3_bucket: "arcadia.mx",
  aws_user_files_s3_bucket_region: "us-east-1",
  aws_cognito_identity_pool_id: "us-east-1:00000000-0000-0000-0000-000000000000", // Placeholder, cambiar por tu Identity Pool ID real
  aws_cognito_region: "us-east-1",
  Storage: {
    AWSS3: {
      bucket: "arcadia.mx",
      region: "us-east-1",
      level: "public"
    }
  }
};

export default awsExports;