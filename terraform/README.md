## Terraform for deploying VibeAuth

### Configure variables

Copy `terraform.tfvars.example` to `terraform.tfvars` and replace the example
values with the credentials for your environment. OAuth client IDs and secrets
are optional; leave a provider's credentials empty or set its `*_enabled` flag
to `false` to keep that provider unavailable. `session_secret` is required and
should be a long, randomly generated value.

Alternatively, provide variables through `TF_VAR_<variable_name>` environment
variables. For example, set `TF_VAR_google_client_secret` and
`TF_VAR_session_secret` in your deployment environment. Do not commit
`terraform.tfvars` or expose secret values in logs. Terraform marks secrets as
sensitive, but they are still stored in Terraform state; protect access to the
state backend accordingly.

### Deploy

```
terraform init -backend-config .backend.tfvars

# allow multi arch
terraform providers lock -platform=linux_arm64 -platform=darwin_arm64

terraform plan -out tf.plan

terraform apply tf.plan
```
