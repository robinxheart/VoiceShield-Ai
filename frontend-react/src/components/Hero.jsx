import RiskHUD from "./RiskHUD";
import AudioAnalyzer from "./AudioAnalyzer";


function Hero({ risk, onAnalysisResult }) {

  return (

    <main className="hero">

      <div className="hero-content">

        <div className="mission-label">
          SECURITY MISSION // 26104
        </div>


        <h1>
          VOICE
          <br />
          <em>UNDER</em>
          <br />
          ATTACK?
        </h1>


        <p className="hero-description">

          Detect suspicious synthetic speech before a trusted
          voice becomes an irreversible action.

        </p>


        <AudioAnalyzer
          onResult={onAnalysisResult}
        />

      </div>


      <RiskHUD
        risk={risk}
      />

    </main>

  );

}


export default Hero;