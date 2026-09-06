import { useRef, useState } from "react";

function AudioAnalyzer({ onResult }) {

  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const selectAudio = () => {
    fileInputRef.current?.click();
  };


  const handleFileChange = (event) => {

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);

  };


  const analyzeAudio = async () => {

    if (!selectedFile) {
      alert("Please select an audio file first.");
      return;
    }

    try {

      setAnalyzing(true);

      const formData = new FormData();

      formData.append(
        "file",
        selectedFile
      );


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


      const data =
        await response.json();


      console.log(
        "AASIST ANALYSIS RESULT:",
        data
      );


      onResult(data);

    } catch (error) {

      console.error(
        "AUDIO ANALYSIS ERROR:",
        error
      );

      alert(
        "Audio analysis failed. Check that FastAPI is running."
      );

    } finally {

      setAnalyzing(false);

    }

  };


  return (

    <div className="audio-analyzer">

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />


      <div className="audio-file-name">

        {selectedFile
          ? selectedFile.name
          : "NO AUDIO FILE SELECTED"}

      </div>


      <div className="hero-actions">

        <button
          className="secondary-button"
          onClick={selectAudio}
        >
          SELECT AUDIO
        </button>


        <button
          className="primary-button"
          onClick={analyzeAudio}
          disabled={analyzing}
        >

          {analyzing
            ? "ANALYZING..."
            : "ANALYZE VOICE"}

          <span>→</span>

        </button>

      </div>

    </div>

  );
}

export default AudioAnalyzer;