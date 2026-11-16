# Cloudflare Worker API setup

This is a small API companion for the GitHub Pages PWA. It currently creates and stores a scene plan only. It does NOT generate images, voice, video, or MP4.

## One-time Cloudflare setup
1. In Cloudflare dashboard, open Workers & Pages -> KV and create a namespace named `AI_CONTENT_AGENT_JOBS`.
2. Copy its namespace ID and replace `REPLACE_WITH_KV_NAMESPACE_ID` in `wrangler.toml`.
3. Create a Cloudflare API token with permission to edit Workers and access the target account.
4. In GitHub repository Settings -> Secrets and variables -> Actions, add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
5. In Cloudflare Workers settings for this Worker, add secret `APP_TOKEN` with a long random value. Do not commit it.
6. Push the changes or manually run the Deploy Cloudflare Worker API workflow.

## Connect the PWA
After deployment, copy the Worker URL (usually `https://ai-content-agent-pro-api.<your-subdomain>.workers.dev`). In the PWA, enter that URL and the same `APP_TOKEN`.

## Current limitations
The Worker stores scene plans in KV for seven days. This is not yet a background media-generation pipeline. Actual image, TTS, video-generation, FFmpeg assembly, durable media storage and notifications still need provider integrations and credentials. Do not describe the product as a finished video agent until an MP4 has been produced and verified.
