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

# Upload Worker Script
resource "cloudflare_workers_script" "my_worker" {
  script_name        = "vibe-auth"
  account_id         = var.cloudflare_account_id
  content            = file("${path.module}/../app/dist/index.js")
  compatibility_date = "2026-10-16"

  main_module = "index.js"
}