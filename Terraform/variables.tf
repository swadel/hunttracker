variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "repository_name" {
  description = "Name of the registry"
  type        = string
  default     = "my-container-registry"
}