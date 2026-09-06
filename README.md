# VoiceShield AI

**Real-time voice cloning and impersonation detection for fraud prevention.**
Built for Smart India Hackathon — Problem Statement SIH25104.

VoiceShield AI analyzes call audio in real time to detect AI-cloned/synthetic voices, combines that signal with transaction-context risk, and locks risky actions (like a payment approval) until the caller's identity is independently verified — without auto-blocking calls or accusing anyone outright.

---

## The Problem

AI voice cloning tools can recreate a person's voice from just a few seconds of audio. Scammers use this to impersonate a CEO, bank official, or family member on a call and pressure victims into urgent transfers or OTP sharing. No accessible tool currently intervenes *during* the call, before money moves.

## The Solution

VoiceShield AI scores each call in near real time using a fused risk model:

\`\`\`
Risk = 0.50 × (deepfake probability)
     + 0.20 × (speaker mismatch)
     + 0.20 × (context risk: unregistered number, high amount, new beneficiary)
     + 0.10 × (prosody anomaly)
\`\`\`

When risk crosses a threshold, the system locks the risky action and prompts independent verification (e.g. call back an official number) instead of silently blocking or accusing the caller.

---

## Architecture

\`\`\`
frontend-react/   React + Vite dashboard (Login, Live Analyzer, Reports)
                   Supabase Auth for login, Supabase DB for session history

backend/           FastAPI server
                   Fine-tuned AASIST anti-spoofing model (PyTorch, GPU-accelerated)
                   Risk fusion engine
                   Writes results back to Supabase via the frontend
\`\`\`

**Flow:** audio uploaded/recorded → sent to backend → fine-tuned AASIST model scores it → combined with context risk → risk score + reasons returned → frontend displays live risk meter and locks the transaction if high-risk → session saved to Supabase → visible on the Reports page.

---

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React, Vite, Supabase Auth |
| Backend | FastAPI, PyTorch |
| ML | Fine-tuned AASIST (ASVspoof 2021 baseline), librosa |
| Database | Supabase (Postgres) |
| Dev hardware | NVIDIA RTX 3050 (CUDA) for training/inference |

---

## Model

We use [AASIST](https://github.com/clovaai/aasist) (Jung et al.), a graph-attention-network-based anti-spoofing model, pretrained on ASVspoof 2021.

**Finding:** the pretrained baseline correctly identifies real speech (100% accuracy on our held-out test set) but performs poorly against modern high-quality voice cloning tools like ElevenLabs (16.7% accuracy on the same set) — the model was trained on 2019-era spoofing methods and hasn't seen modern neural TTS artifacts.

**Fix:** we fine-tuned only the final classification layer on a small curated dataset of real and modern-TTS-cloned voice samples (48 training clips), improving held-out accuracy from **58.3% → 100%**. See \`backend/aasist-main/\` for the model code and \`backend/voice_model.py\` for the inference wrapper used by the API.

---

## Setup

### Backend
\`\`\`bash
cd backend
python -m venv venv
venv\\Scripts\\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

# Create a .env file (see .env.example)
uvicorn main:app --reload
\`\`\`

### Frontend
\`\`\`bash
cd frontend-react
npm install

# Create a .env file (see .env.example)
npm run dev
\`\`\`

### Database
Run the SQL in \`supabase/schema.sql\` in your Supabase project's SQL Editor to create the required tables.

---

## Environment Variables

**backend/.env**
\`\`\`
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
\`\`\`

**frontend-react/.env**
\`\`\`
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
\`\`\`

Never commit \`.env\` files — see \`.gitignore\`.

---

## Team

Built by [Your Team Name] for Smart India Hackathon 2026, Problem Statement SIH25104.

## License

See [LICENSE](LICENSE). The AASIST model code in \`backend/aasist-main/\` is used under its original license from [clovaai/aasist](https://github.com/clovaai/aasist) — see \`backend/aasist-main/LICENSE\` and \`NOTICE\`.