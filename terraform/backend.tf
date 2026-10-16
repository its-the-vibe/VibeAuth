terraform {

  backend "s3" {
    region = "auto"

    # Enable native file-based state locking
    use_lockfile = true

    # Required flags for Cloudflare R2 compatibility
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
  }

}
