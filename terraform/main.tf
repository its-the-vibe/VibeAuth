terraform {
  required_version = ">= 1.15.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "cloudflare_worker" "my_worker" {
  account_id = var.cloudflare_account_id
  name       = "vibe-auth"

  observability = {
    enabled = true
  }

  subdomain = {
    enabled          = true
    previews_enabled = true
  }
}

resource "cloudflare_worker_version" "my_worker_version" {
  account_id         = var.cloudflare_account_id
  worker_id          = cloudflare_worker.my_worker.id
  compatibility_date = "2026-10-16"
  main_module        = "index.js"

  modules = [
    {
      name         = "index.js"
      content_type = "application/javascript+module"
      content_file = "${path.module}/../app/dist/index.js"
    }
  ]
}

resource "cloudflare_workers_deployment" "my_worker_deployment" {
  account_id  = var.cloudflare_account_id
  script_name = cloudflare_worker.my_worker.name
  strategy    = "percentage"
  versions = [{
    percentage = 100
    version_id = cloudflare_worker_version.my_worker_version.id
  }]
}
