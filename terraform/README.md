## Terraform for deploying VibeAuth

```
terraform init -backend-config .backend.tfvars

# allow multi arch
terraform providers lock -platform=linux_arm64 -platform=darwin_arm64

terraform plan -out tf.plan

terraform apply tf.plan
```


