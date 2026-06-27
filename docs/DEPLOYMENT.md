# Deployment

## Vercel

ThesisBench is a standard Next.js app and can be deployed directly from GitHub.

Current public URL: [https://thesisbench.vercel.app](https://thesisbench.vercel.app)

Required production environment variables for live Qwen parsing:

```bash
BITGET_QWEN_API_KEY=
BITGET_QWEN_BASE_URL=https://hackathon.bitgetops.com/v1
BITGET_QWEN_MODEL=qwen3.6-plus
BITGET_QWEN_FAST_MODEL=qwen3.6-flash
```

If `BITGET_QWEN_API_KEY` is not set, the demo still works with the deterministic offline parser and cached fixture data.

## Public Demo Checklist

- No login required.
- `npm run build` passes.
- `/api/analyze` returns a verdict for the three README demo theses.
- `runs/` artifacts are committed for judge review.
- No `.env.local` or real API key is committed.
