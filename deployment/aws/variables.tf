variable "aws_region" {
  description = "AWS region for deployments"
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Project name identifier"
  type        = string
  default     = "oneself"
}

variable "environment" {
  description = "Deployment environment (production, staging, dev)"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "domain_name" {
  description = "Primary root domain for the platform"
  type        = string
  default     = "oneself.com"
}
