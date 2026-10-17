variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare Account ID"
}

variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "Cloudflare API token with appropriate permissions"
}

variable "google_client_id" {
  type        = string
  default     = ""
  description = "Google OAuth client ID"
}

variable "google_client_secret" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Google OAuth client secret"
}

variable "google_enabled" {
  type        = bool
  default     = true
  description = "Whether Google sign-in is enabled"
}

variable "meta_client_id" {
  type        = string
  default     = ""
  description = "Meta OAuth client ID"
}

variable "meta_client_secret" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Meta OAuth client secret"
}

variable "meta_enabled" {
  type        = bool
  default     = true
  description = "Whether Meta sign-in is enabled"
}

variable "github_client_id" {
  type        = string
  default     = ""
  description = "GitHub OAuth client ID"
}

variable "github_client_secret" {
  type        = string
  default     = ""
  sensitive   = true
  description = "GitHub OAuth client secret"
}

variable "github_enabled" {
  type        = bool
  default     = true
  description = "Whether GitHub sign-in is enabled"
}

variable "strava_client_id" {
  type        = string
  default     = ""
  description = "Strava OAuth client ID"
}

variable "strava_client_secret" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Strava OAuth client secret"
}

variable "strava_enabled" {
  type        = bool
  default     = true
  description = "Whether Strava sign-in is enabled"
}

variable "session_secret" {
  type        = string
  sensitive   = true
  description = "Secret used to sign and verify user sessions"
}
