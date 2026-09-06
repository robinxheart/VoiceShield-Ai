import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

function LiveAnalyzer({ onResult }) {

  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("MICROPHONE READY");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [liveRisk, setLiveRisk] = useState(null);
  const [liveLevel, setLiveLevel] = useState("WAITING");
  const [alertMessage, setAlertMessage] = useState(null);
  const timerRef = useRef(null);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  const barsRef = useRef([]);


  /*
   * ========================================
   * REAL MICROPHONE WAVEFORM
   * ========================================
   */

  const animateWaveform = () => {

    if (!analyserRef.current) {
      return;
    }

    const analyser = analyserRef.current;

    const dataArray =
      new Uint8Array(
        analyser.frequencyBinCount
      );

    analyser.getByteFrequencyData(dataArray);


    barsRef.current.forEach((bar, index) => {

      if (!bar) {
        return;
      }

      const position =
        Math.floor(
          (index / barsRef.current.length) *
          dataArray.length
        );

      const value =
        dataArray[position] || 0;

      const height =
        Math.max(
          8,
          Math.min(
            100,
            value * 0.9
          )
        );

      bar.style.height =
        `${height}%`;

    });


    animationRef.current =
      requestAnimationFrame(
        animateWaveform
      );

  };


  /*
   * ========================================
   * STOP WAVEFORM
   * ========================================
   */

  const stopWaveform = () => {

    if (animationRef.current) {

      cancelAnimationFrame(
        animationRef.current
      );

      animationRef.current = null;

    }

  };


  /*
   * ========================================
   * START RECORDING
   * ========================================
   */

  const startRecording = async () => {

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true
        });


      streamRef.current = stream;

      chunksRef.current = [];


      const mediaRecorder =
        new MediaRecorder(stream);


      mediaRecorderRef.current =
        mediaRecorder;


      mediaRecorder.ondataavailable =
        (event) => {

          if (event.data.size > 0) {

            chunksRef.current.push(
              event.data
            );

          }

        };


      mediaRecorder.onstart = () => {

        setRecording(true);

        setElapsedSeconds(0);

        setLiveRisk(null);
        setLiveLevel("WAITING");

timerRef.current = setInterval(() => {
  setElapsedSeconds((previous) => previous + 1);
}, 1000);

        setStatus(
          "● MICROPHONE RECORDING..."
        );


        /*
         * Create audio analyser
         */

        const AudioContext =
          window.AudioContext ||
          window.webkitAudioContext;


        const audioContext =
          new AudioContext();


        audioContextRef.current =
          audioContext;


        const source =
          audioContext.createMediaStreamSource(
            stream
          );


        const analyser =
          audioContext.createAnalyser();


        analyser.fftSize = 256;

        analyser.smoothingTimeConstant =
          0.75;


        source.connect(analyser);


        analyserRef.current =
          analyser;


        /*
         * Start real waveform
         */

        animateWaveform();

      };


      mediaRecorder.onstop =
        async () => {

          stopWaveform();


          /*
           * Stop microphone
           */

          stream
            .getTracks()
            .forEach(
              track => track.stop()
            );


          streamRef.current =
            null;


          /*
           * Close audio analyser
           */

          if (
            audioContextRef.current
          ) {

            await audioContextRef.current
              .close();

            audioContextRef.current =
              null;

          }


          setRecording(false);

if (timerRef.current) {
  clearInterval(timerRef.current);
  timerRef.current = null;
}

setProcessing(true);

          setStatus(
            "PROCESSING VOICE..."
          );


          /*
           * Create audio file
           */

          const audioBlob =
            new Blob(
              chunksRef.current,
              {
                type: "audio/webm"
              }
            );


          console.log(
            "LIVE AUDIO SIZE:",
            audioBlob.size
          );


          /*
           * Send to FastAPI
           */

          const formData =
            new FormData();


          formData.append(
            "file",
            audioBlob,
            "live_voice.webm"
          );


          try {

            const response =
              await fetch(
                "http://127.0.0.1:8000/api/analyze-audio",
                {
                  method: "POST",
                  body: formData
                }
              );


            if (!response.ok) {

              throw new Error(
                `Server returned ${response.status}`
              );

            }


            const data =
              await response.json();


            console.log(
              "LIVE AASIST RESULT:",
              data
            );

// Save analysis to Supabase
try {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const { error: dbError } = await supabase
      .from("call_sessions")
      .insert({
        user_id: user.id,
        filename: data.filename,
        duration_seconds: data.duration_seconds,
        deepfake_probability: data.aasist_spoof_score,
        aasist_spoof_score: data.aasist_spoof_score,
        bona_fide_probability: data.bona_fide_probability,
        final_risk: data.final_risk,
        level: data.level,
        model: data.model,
        status:
          data.final_risk >= 50
            ? "BLOCKED"
            : "CLEARED"
      });

    if (dbError) {
      console.error(
        "SUPABASE SAVE ERROR:",
        dbError
      );
    } else {
      console.log(
        "ANALYSIS SAVED TO SUPABASE"
      );
    }
  } else {
    console.log(
      "No logged-in user — analysis not saved."
    );
  }
} catch (dbError) {
  console.error(
    "SUPABASE ERROR:",
    dbError
  );
}

setLiveRisk(Number(data.final_risk));
setLiveLevel(data.level);
if (data.final_risk >= 50) { setAlertMessage("⚠️ ALERT SENT TO SUPERVISOR: +91-98XXXXXXXX"); } else { setAlertMessage(null); }

            onResult(data);


            setStatus(
              "ANALYSIS COMPLETE"
            );

          } catch (error) {

            console.error(
              "LIVE ANALYSIS ERROR:",
              error
            );


            setStatus(
              "ANALYSIS FAILED"
            );

          } finally {

            setProcessing(false);

          }

        };


      mediaRecorder.start();

    } catch (error) {

      console.error(
        "MICROPHONE ERROR:",
        error
      );


      setStatus(
        "MICROPHONE ACCESS DENIED"
      );

    }

  };


  /*
   * ========================================
   * STOP RECORDING
   * ========================================
   */

  const stopRecording = () => {

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state ===
        "recording"
    ) {

      mediaRecorderRef.current.stop();

    }

  };

const handleFileUpload = async (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  setProcessing(true);
  setStatus("ANALYZING UPLOADED AUDIO...");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/analyze-audio",
      {
        method: "POST",
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(
        `Server returned ${response.status}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.details || data.error);
    }

    onResult(data);

        // Save uploaded audio analysis to Supabase
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        const { error: dbError } = await supabase
          .from("call_sessions")
          .insert({
            user_id: user.id,
            filename: data.filename,
            duration_seconds: data.duration_seconds,
            deepfake_probability: data.aasist_spoof_score,
            aasist_spoof_score: data.aasist_spoof_score,
            bona_fide_probability: data.bona_fide_probability,
            final_risk: data.final_risk,
            level: data.level,
            model: data.model,
            status: data.final_risk >= 50
              ? "BLOCKED"
              : "CLEARED"
          });
              if (data.final_risk >= 50) { setAlertMessage("⚠️ ALERT SENT TO SUPERVISOR: +91-98XXXXXXXX"); } else { setAlertMessage(null); }

        if (dbError) {
          console.error("UPLOAD SUPABASE SAVE ERROR:", dbError);
        }
      }
    } catch (dbError) {
      console.error("UPLOAD SUPABASE ERROR:", dbError);
    }

    setStatus("FILE ANALYSIS COMPLETE");

  } catch (error) {
    console.error("FILE ANALYSIS ERROR:", error);
    setStatus("FILE ANALYSIS FAILED");
  } finally {
    setProcessing(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }
};

  /*
   * ========================================
   * CLEANUP
   * ========================================
   */

  useEffect(() => {

    return () => {

      stopWaveform();


      if (streamRef.current) {

        streamRef.current
          .getTracks()
          .forEach(
            track => track.stop()
          );

      }


      if (
        audioContextRef.current
      ) {

        audioContextRef.current.close();

      }

    };

  }, []);


  /*
   * ========================================
   * UI
   * ========================================
   */

  return (

    <div className="live-analyzer">


      <div className="live-waveform" id="liveWaveform">

        {Array.from(
          { length: 32 },
          (_, index) => (

            <i
              key={index}
              ref={(element) => {

                barsRef.current[index] =
                  element;

              }}
            />

          )
        )}

      </div>


      <div className="live-status">

        {status}

      </div>

<div className="live-timer">
  {String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:
  {String(elapsedSeconds % 60).padStart(2, "0")}
</div>

<div className="live-risk">
  <span>LIVE RISK</span>

  <strong>
    {liveRisk !== null ? `${liveRisk.toFixed(2)}%` : "--"}
  </strong>

  <small>
    {liveLevel}
  </small>
</div>
{alertMessage && (
  <div style={{marginTop:"12px",padding:"10px 16px",border:"1px solid #ff4444",color:"#ff4444",fontWeight:"bold",borderRadius:"4px",textAlign:"center"}}>
    {alertMessage}
  </div>
)}

      <button
        type="button"
        className="primary-button"
        onClick={
          recording
            ? stopRecording
            : startRecording
        }
        disabled={processing}
      >

        {recording
          ? "■ STOP LIVE ANALYSIS"
          : processing
            ? "ANALYZING..."
            : "🎙 START LIVE ANALYSIS"}

        {!recording &&
          !processing && (
            <span>→</span>
          )}

      </button>

<input
  ref={fileInputRef}
  type="file"
  accept="audio/*"
  onChange={handleFileUpload}
  style={{ display: "none" }}
/>

<button
  type="button"
  className="secondary-button"
  onClick={() => fileInputRef.current?.click()}
  disabled={processing || recording}
>
  📁 UPLOAD AUDIO FILE
</button>

    </div>

  );

}


export default LiveAnalyzer;