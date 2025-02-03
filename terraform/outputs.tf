// outputs.tf
// ------------------------------------------------------------------
// Output useful information after the Terraform apply.
// ------------------------------------------------------------------

output "website_url" {
  description = "URL for the S3 website endpoint"
  value       = "http://${aws_s3_bucket.website_bucket.id}.s3-website-${var.aws_region}.amazonaws.com"
}

output "cloudfront_domain" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.user_pool.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.user_pool_client.id
}

output "orders_table" {
  description = "DynamoDB table name for Orders"
  value       = aws_dynamodb_table.orders.name
}

output "lambda_function_arn" {
  description = "ARN of the order_processor Lambda function"
  value       = aws_lambda_function.order_processor.arn
}
