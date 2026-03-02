terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable the Artifact Registry API
resource "google_project_service" "artifact_registry" {
  service = "artifactregistry.googleapis.com"
}

# Create the registry
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = var.repository_name
  format        = "DOCKER"
  description   = "Docker container registry"

  depends_on = [google_project_service.artifact_registry]  # <-- wait for API to be enabled
}