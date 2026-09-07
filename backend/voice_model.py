"""
voice_model.py

Wraps the fine-tuned AASIST model into a single function the backend can call:

    from voice_model import run_model
    spoof_prob = run_model(audio_bytes)   # returns float 0.0-1.0

Place this file in the backend project (or import path), alongside a copy of:
  - models/AASIST.py           (from the aasist repo)
  - config/AASIST.conf
  - models/weights/AASIST_finetuned.pth

Directory expected (adjust paths below if different):
  backend/
    voice_model.py
    aasist_model/
      AASIST.py
      AASIST.conf
      AASIST_finetuned.pth
"""

import io
import json
import numpy as np
import librosa
import torch

from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent
AASIST_DIR = BASE_DIR / "aasist-main"
sys.path.append(str(AASIST_DIR))

from models.AASIST import Model

CONFIG_PATH = str(AASIST_DIR / "config" / "AASIST.conf")
WEIGHTS_PATH = str(AASIST_DIR / "models" / "weights" / "AASIST_finetuned.pth")
TARGET_SR = 16000
NB_SAMP = 64600  # ~4.04 seconds at 16kHz

_device = "cuda" if torch.cuda.is_available() else "cpu"
_model = None  # loaded lazily on first call


def _load_model():
    global _model
    if _model is not None:
        return _model

    with open(CONFIG_PATH, "r") as f:
        config = json.load(f)
    model = Model(config["model_config"]).to(_device)
    state_dict = torch.load(WEIGHTS_PATH, map_location=_device)
    model.load_state_dict(state_dict)
    model.eval()
    _model = model
    return _model


def _pad_or_trim(audio, target_len=NB_SAMP):
    if len(audio) >= target_len:
        return audio[:target_len]
    num_repeats = int(target_len / len(audio)) + 1
    audio = np.tile(audio, num_repeats)
    return audio[:target_len]


def run_model(audio_bytes: bytes) -> float:
    """
    Takes raw audio bytes (any format librosa/soundfile can decode: wav, mp3, etc.)
    Returns: float 0.0-1.0, the probability the audio is SPOOFED (synthetic/cloned).
    Higher = more likely fake.
    """
    model = _load_model()

    # Load audio from in-memory bytes
    audio, sr = librosa.load(io.BytesIO(audio_bytes), sr=TARGET_SR, mono=True)
    audio = _pad_or_trim(audio)

    x = torch.tensor(audio, dtype=torch.float32).unsqueeze(0).to(_device)
    with torch.no_grad():
        _, output = model(x)
        probs = torch.softmax(output, dim=1).squeeze().cpu().numpy()

    spoof_prob = float(probs[1])
    return spoof_prob


def run_model_from_array(audio_array: np.ndarray, sr: int = TARGET_SR) -> float:
    """
    Alternative entry point if the backend already has a numpy array
    (e.g. decoded from a WebSocket audio chunk) instead of raw file bytes.
    audio_array should be mono float32. Resample beforehand if sr != 16000.
    """
    model = _load_model()

    if sr != TARGET_SR:
        audio_array = librosa.resample(audio_array, orig_sr=sr, target_sr=TARGET_SR)

    audio_array = _pad_or_trim(audio_array.astype(np.float32))

    x = torch.tensor(audio_array, dtype=torch.float32).unsqueeze(0).to(_device)
    with torch.no_grad():
        _, output = model(x)
        probs = torch.softmax(output, dim=1).squeeze().cpu().numpy()

    return float(probs[1])


if __name__ == "__main__":
    # quick manual test: python voice_model.py path/to/audio.wav
    import sys
    if len(sys.argv) < 2:
        print("Usage: python voice_model.py <audio_file>")
        sys.exit(1)

    with open(sys.argv[1], "rb") as f:
        audio_bytes = f.read()

    score = run_model(audio_bytes)
    print(f"File: {sys.argv[1]}")
    print(f"Spoof probability: {score:.4f}")
    print(f"Prediction: {'FAKE' if score >= 0.5 else 'REAL'}")