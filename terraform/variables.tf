// variables.tf
// ------------------------------------------------------------------
// Define the variables for AWS region, S3 bucket name, and environment.
// ------------------------------------------------------------------

variable "aws_region" {
  description = "The AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "The S3 bucket name for the website. Must be globally unique and follow S3 naming rules (all lowercase, 3-63 characters, no underscores)."
  type        = string
  default     = "capstone-ecommerce"  // This name is valid. Change if necessary.
}

variable "environment" {
  description = "The environment tag (e.g., production, staging)"
  type        = string
  default     = "production"
}
