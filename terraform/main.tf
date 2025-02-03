// main.tf
// ------------------------------------------------------------------
// AWS Provider configuration
// ------------------------------------------------------------------
provider "aws" {
  region = var.aws_region
}

///////////////////////////
// S3 Bucket for Website   //
///////////////////////////
// Create an S3 bucket using the variable bucket_name.
// Note: We do not set an ACL here because our account or bucket settings
// block public ACLs. Instead, public access will be granted via the bucket policy.
resource "aws_s3_bucket" "website_bucket" {
  bucket = var.bucket_name

  tags = {
    Name        = var.bucket_name
    Environment = var.environment
  }
}

///////////////////////////
// Public Access Block     //
// ------------------------------------------------------------------
// Disable block public access so that our bucket policy can be applied.
// (Make sure your account settings allow this override.)
resource "aws_s3_bucket_public_access_block" "website_public_access" {
  bucket                  = aws_s3_bucket.website_bucket.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

///////////////////////////
// S3 Website Configuration//
// ------------------------------------------------------------------
// Configure the website settings using blocks for index_document and error_document.
resource "aws_s3_bucket_website_configuration" "website_config" {
  bucket = aws_s3_bucket.website_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "404.html"
  }
}

///////////////////////////
// S3 Bucket Policy        //
// ------------------------------------------------------------------
// Create a policy document that allows public read access.
data "aws_iam_policy_document" "s3_policy" {
  statement {
    actions = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.website_bucket.arn}/*"]
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }
}

// Attach the policy to the bucket.
resource "aws_s3_bucket_policy" "website_policy" {
  bucket = aws_s3_bucket.website_bucket.id
  policy = data.aws_iam_policy_document.s3_policy.json
}

///////////////////////////
// CloudFront Distribution //
// ------------------------------------------------------------------
// Create a CloudFront distribution that uses the S3 website endpoint.
// The computed domain name follows the format:
//   bucket-name.s3-website-aws-region.amazonaws.com
resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name = "${aws_s3_bucket.website_bucket.id}.s3-website-${var.aws_region}.amazonaws.com"
    origin_id   = "S3-${aws_s3_bucket.website_bucket.id}"

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "http-only"
      origin_keepalive_timeout = 5
      origin_read_timeout      = 30
      origin_ssl_protocols     = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = false
    default_ttl            = 3600
    max_ttl                = 86400
    min_ttl                = 0
    target_origin_id       = "S3-${aws_s3_bucket.website_bucket.id}"

    forwarded_values {
      query_string            = false
      query_string_cache_keys = []
      cookies {
        forward           = "none"
        whitelisted_names = []
      }
      headers = []
    }

    viewer_protocol_policy = "redirect-to-https"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
      locations        = []
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1"
  }

  tags = {
    Environment = var.environment
  }
}

///////////////////////////
// Cognito User Pool       //
// ------------------------------------------------------------------
// Create a Cognito user pool for user authentication.
resource "aws_cognito_user_pool" "user_pool" {
  name = "ecommerce_user_pool"

  password_policy {
    minimum_length                   = 8
    require_uppercase                = true
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  tags = {
    Environment = var.environment
  }
}

///////////////////////////
// Cognito User Pool Client//
// ------------------------------------------------------------------
// Create a Cognito user pool client for your application.
resource "aws_cognito_user_pool_client" "user_pool_client" {
  name         = "ecommerce_app_client"
  user_pool_id = aws_cognito_user_pool.user_pool.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  generate_secret = false
}

///////////////////////////
// DynamoDB Table          //
// ------------------------------------------------------------------
// Create a DynamoDB table named "Orders".
resource "aws_dynamodb_table" "orders" {
  name         = "Orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "order_id"

  attribute {
    name = "order_id"
    type = "S"
  }

  tags = {
    Environment = var.environment
  }
}

///////////////////////////
// IAM Role for Lambda     //
// ------------------------------------------------------------------
// Create an IAM role that the Lambda function will assume.
resource "aws_iam_role" "lambda_role" {
  name = "ecommerce_lambda_role"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

///////////////////////////
// IAM Role Policy Attachments for Lambda //
// ------------------------------------------------------------------
// Attach AWSLambdaBasicExecutionRole for CloudWatch Logs.
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

// Attach AmazonDynamoDBFullAccess so that the Lambda can access DynamoDB.
resource "aws_iam_role_policy_attachment" "lambda_dynamodb_access" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

///////////////////////////
// Archive Lambda Code     //
// ------------------------------------------------------------------
// Archive and package the Lambda function code.
// The path "../lambda/order_processor.py" goes one level up from terraform/ into the lambda/ folder.
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/order_processor.py"
  output_path = "${path.module}/../lambda/order_processor.zip"
}

///////////////////////////
// Lambda Function         //
// ------------------------------------------------------------------
// Create the Lambda function that uses the ZIP file generated above.
resource "aws_lambda_function" "order_processor" {
  function_name    = "order_processor"
  role             = aws_iam_role.lambda_role.arn
  handler          = "order_processor.lambda_handler"  // Filename (without .py) and function name.
  runtime          = "python3.8"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 10
  memory_size      = 128

  tags = {
    Environment = var.environment
  }
}

///////////////////////////
// CloudWatch Alarm        //
// ------------------------------------------------------------------
// Create a CloudWatch metric alarm to monitor Lambda errors.
resource "aws_cloudwatch_metric_alarm" "lambda_errors_alarm" {
  alarm_name          = "LambdaErrorsAlarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "missing"
  actions_enabled     = true

  dimensions = {
    FunctionName = aws_lambda_function.order_processor.function_name
  }
}
