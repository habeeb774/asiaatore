# Image conversion in CI (CI-only policy)

This project uses a CI-first approach for converting image assets (WebP/AVIF) instead of committing derived binaries into Git. The rationale:

- Avoid bloating the Git repository with generated image blobs from `uploads/`.
- Keep builds reproducible by running image conversion on a clean runner.
- Allow optional automatic publishing of converted assets to an object store / CDN.

## What the workflow does today

- The CI workflow (`.github/workflows/ci.yml`) runs a job `images` after the build. It executes `client/scripts/convert-images-to-webp.js` and uploads the converted `.webp` files as a workflow artifact (`converted-webp`).

## Publishing converted images to a CDN (optional)

The workflow includes an optional `publish-images` job that will upload converted images to an S3-compatible bucket (S3, Cloudflare R2 with S3 compatibility, MinIO, etc.) only when the required secrets are configured in the repository settings.

Secrets required (set these in GitHub > Repo Settings > Secrets > Actions):

- `AWS_S3_BUCKET` — the target bucket name (or R2 bucket name when using S3-compatible endpoint).
- `AWS_ACCESS_KEY_ID` — access key with permission to write the bucket.
- `AWS_SECRET_ACCESS_KEY` — secret key.
- Optional: `AWS_REGION` — aws region (default: `us-east-1`).
- Optional: `AWS_S3_PREFIX` — prefix path inside the bucket (default: `images/webp`).
- Optional: `AWS_S3_ENDPOINT` — custom S3 endpoint (not currently wired to the AWS CLI in the workflow; if you need it, we can switch to `aws --endpoint-url` usage).

How it works when enabled:

1. CI runs the `images` job and creates `converted-webp` artifact.
2. The `publish-images` job runs (only if the required secrets exist) and syncs the `client/` and `uploads/` `.webp` files to `s3://$AWS_S3_BUCKET/$AWS_S3_PREFIX/` using `aws s3 sync`.
3. Files are uploaded with `public-read` ACL in the current implementation. If you'd prefer private objects + CDN origin pull, we can change that.

Security notes

- Use a dedicated key with minimal privileges (only the bucket and prefix). For AWS, create an IAM policy limited to `s3:PutObject`, `s3:PutObjectAcl`, and `s3:ListBucket` for the specific bucket/prefix.
- Do not store long-term secrets in source; use GitHub Secrets.

Recommended next steps

- If you use Cloudflare R2, provide `AWS_S3_ENDPOINT` and we will update the workflow to pass `--endpoint-url` to `aws s3` commands.
- If you prefer a different provider (Azure Blob or GCP), I can add a variant of the job to use `az storage blob upload-batch` or `gsutil`.

Questions? Want me to wire `--endpoint-url` for R2 or change ACL behavior? Reply and I’ll update the workflow.
