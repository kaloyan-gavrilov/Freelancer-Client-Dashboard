# ADR-006: GCS + Cloud CDN for Frontend Hosting

**Date:** 2026-02-18
**Status:** Accepted
**Author:** Team Zlaten Vek

---

## Context

In production, the React frontend compiles to static assets (HTML, JS, CSS, images). We need a serving strategy that:

- Delivers assets globally with low latency
- Scales automatically without managing servers
- Integrates with our existing GCP infrastructure and GitHub Actions CI/CD
- Keeps costs low (static hosting is inherently cheaper than running compute)

---

## Options Considered

### Option A: Node.js Server (Express or Vite Preview)

- **Pros:** Simple setup, same runtime as backend, supports server-side rendering if needed later.
- **Cons:** Running a Node server just to serve static files wastes compute. Requires auto-scaling configuration, health checks, and a load balancer. Higher cost and operational overhead for a purely static workload.

### Option B: GCS + Cloud CDN (chosen)

- **Pros:** Static files uploaded to a GCS bucket. Cloud CDN caches assets at edge locations globally. No server to manage — GCS handles availability and durability. GitHub Actions deploys with `gsutil rsync` and invalidates the CDN cache. Cost is pennies per GB of storage and transfer.
- **Cons:** Requires GCP setup (bucket, load balancer, URL map, CDN configuration). No server-side rendering. SPA routing must be handled by configuring the bucket's error page to `index.html` or using a URL rewrite rule.

### Option C: S3 + CloudFront

- **Pros:** Equivalent to GCS + Cloud CDN but on AWS. Mature, widely documented.
- **Cons:** The backend already deploys to GCP (Cloud Run). Using AWS for frontend would split infrastructure across two cloud providers, complicating IAM, billing, and deployment pipelines.

### Option D: Vercel

- **Pros:** Zero-config deployment, automatic previews for PRs, global edge network.
- **Cons:** Adds a third-party dependency outside our GCP stack. Free tier limits may not be sufficient. Less control over caching and CDN behaviour.

---

## Decision

We chose **GCS + Cloud CDN** for frontend hosting in production.

The deployment pipeline in `.github/workflows/frontend.yml`:

1. Builds the frontend with production environment variables injected
2. Uploads the `dist/` folder to a GCS bucket using `gsutil -m rsync -r -d`
3. Invalidates the CDN cache with `gcloud compute url-maps invalidate-cdn-cache`

For local development and staging, the Docker Compose setup uses the `nginx:alpine` stage from the frontend Dockerfile (see [ADR-005](ADR-005-multistage-docker.md)).

---

## Consequences

- **Positive:** Global CDN delivery with minimal latency. Zero servers to manage for the frontend. Deployment is a simple file sync + cache invalidation. Costs are negligible for a static site. Keeps all infrastructure on GCP alongside the backend.
- **Negative:** Initial GCP setup requires configuring a bucket, external HTTP(S) load balancer, URL map, backend bucket, and SSL certificate. SPA routing requires configuring the custom error page or a URL rewrite. CDN cache invalidation adds ~1 minute to deploy times.
