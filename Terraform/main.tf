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

# Deploy to Cloud Run
	resource "google_project_service" "cloud_run" {
  service = "run.googleapis.com"
}

	resource "google_cloud_run_v2_service" "app" {
  name     = "my-node-app"
  location = var.region

	  template {
    containers {
      image = "us-central1-docker.pkg.dev/${var.project_id}/${var.repository_name}/my-node-app:latest"

	      ports {
        container_port = 3000
      }
    }
  }

  depends_on = [google_project_service.cloud_run]
}

# Make the app publicly accessible
resource "google_cloud_run_v2_service_iam_member" "public" {
  name     = google_cloud_run_v2_service.app.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}