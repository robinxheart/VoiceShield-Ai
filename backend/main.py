from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import subprocess
import librosa
import numpy as np
from datetime import datetime, timezone

from voice_model import run_model  # your fine-tuned AASIST wrapper
from supabase import create_client

# ==============================
# SUPABASE SETUP
# ==============================

from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("VOICE MODEL + SUPABASE READY")

app = FastAPI(
    title="VoiceShield AI",
    description="Real-Time Voice Integrity and Fraud Prevention API",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "VoiceShield AI Backend is Running", "status": "online"}


@app.get("/api/status")
def status():
    return {
        "system": "VoiceShield AI",
        "status": "ONLINE",
        "risk_engine": "READY",
        "audio_analysis": "READY"
    }


latest_risk = {
    "deepfake_probability": 0,
    "context_risk": None,
    "final_risk": 0,
    "level": "LOW",
    "message": "No audio has been analyzed yet."
}


@app.get("/api/risk")
def risk():
    return latest_risk


# ==============================
# RISK FUSION FORMULA
# ==============================
def compute_context_risk(context_flags: dict) -> float:
    """Simple average of triggered risk flags, returns 0-100 scale."""
    if not context_flags:
        return 0.0
    return (sum(1 for v in context_flags.values() if v) / len(context_flags)) * 100


def compute_final_risk(deepfake_prob_pct: float, context_risk_pct: float,
                        prosody_pct: float = 0.0, speaker_mismatch_pct: float = 0.0) -> float:
    """
    All inputs on 0-100 scale. Weights match our documented formula:
    50% deepfake, 20% speaker mismatch, 20% context, 10% prosody.
    """
    fused = (
        0.50 * deepfake_prob_pct +
        0.20 * speaker_mismatch_pct +
        0.20 * context_risk_pct +
        0.10 * prosody_pct
    )
    return round(fused, 2)


def get_risk_level(score: float) -> str:
    if score >= 75:
        return "CRITICAL"
    elif score >= 50:
        return "HIGH"
    elif score >= 25:
        return "MEDIUM"
    else:
        return "LOW"


@app.post("/api/analyze-audio")
async def analyze_audio(file: UploadFile = File(...)):
    global latest_risk

    os.makedirs("uploads", exist_ok=True)
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join("uploads", filename)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    try:
        if file_path.lower().endswith(".wav"):
            wav_path = file_path
        else:
            wav_path = file_path.rsplit(".", 1)[0] + ".wav"
            subprocess.run(
                ["ffmpeg", "-y", "-i", file_path, "-ac", "1", "-ar", "16000", wav_path],
                check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
            )

        # Read the wav file as bytes for voice_model.run_model()
        with open(wav_path, "rb") as f:
            audio_bytes = f.read()

        # Run your fine-tuned model -- returns spoof probability 0.0-1.0
        spoof_prob = run_model(audio_bytes)
        deepfake_probability = round(spoof_prob * 100, 2)
        bona_fide_probability = round((1 - spoof_prob) * 100, 2)

        # --- Context risk (hardcoded flags for demo; wire to real logic later) ---
        context_flags = {
            "unregistered_number": True,
            "high_amount": True,
            "new_beneficiary": True
        }
        context_risk = compute_context_risk(context_flags)

        final_risk = compute_final_risk(
            deepfake_prob_pct=deepfake_probability,
            context_risk_pct=context_risk,
            prosody_pct=0.0,
            speaker_mismatch_pct=0.0
        )
        level = get_risk_level(final_risk)

        reasons = []
        if deepfake_probability > 50:
            reasons.append(f"Synthetic speech detected ({deepfake_probability:.0f}% confidence)")
        if context_flags.get("unregistered_number"):
            reasons.append("Unregistered caller number")
        if context_flags.get("high_amount"):
            reasons.append("High-value transfer requested")
        if context_flags.get("new_beneficiary"):
            reasons.append("New beneficiary account")

        audio_for_duration, sample_rate = librosa.load(wav_path, sr=16000, mono=True)
        duration = float(librosa.get_duration(y=audio_for_duration, sr=sample_rate))

        result = {
            "filename": file.filename,
            "duration_seconds": round(duration, 2),
            "sample_rate": sample_rate,
            "deepfake_probability": deepfake_probability,
            "bona_fide_probability": bona_fide_probability,
            "context_risk": context_risk,
            "speaker_mismatch": None,
            "prosody_anomaly": None,
            "final_risk": final_risk,
            "level": level,
            "reasons": reasons,
            "model": "AASIST-finetuned",
            "message": "Audio analyzed using the fine-tuned AASIST anti-spoofing model."
        }

        latest_risk = result

        # --- Write to Supabase ---
        try:
            session = supabase.table("call_sessions").insert({
                "caller_label": "Prototype Demo Call",
                "audio_duration_sec": duration
            }).execute()
            session_id = session.data[0]["id"]

            supabase.table("risk_events").insert({
                "session_id": session_id,
                "deepfake_score": deepfake_probability,
                "context_score": context_risk,
                "prosody_score": 0,
                "fused_risk_score": final_risk,
                "risk_level": level
            }).execute()

            if level in ("HIGH", "CRITICAL"):
                supabase.table("alerts").insert({
                    "session_id": session_id,
                    "action_taken": "transfer_locked",
                    "notified_number": "+91-XXXXXXXXXX",
                    "notification_status": "simulated_sent"
                }).execute()

            result["session_id"] = session_id
        except Exception as db_error:
            print("Supabase write failed:", db_error)
            result["supabase_error"] = str(db_error)

        return result

    except Exception as error:
        return {"error": "Audio analysis failed", "details": str(error)}