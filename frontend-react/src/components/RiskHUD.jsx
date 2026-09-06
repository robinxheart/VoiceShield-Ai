function RiskHUD({ risk }) {

  const score =
    risk?.final_risk ?? null;

  const level =
    risk?.level ?? "AWAITING ANALYSIS";

  const deepfake =
    risk?.deepfake_probability ?? null;

  const duration =
    risk?.duration_seconds ?? null;


  return (

    <div className="risk-hud">


      <div className="risk-header">

        <span>
          LIVE THREAT LEVEL
        </span>

        <strong>
          {score !== null
            ? score
            : "--"}
        </strong>

      </div>


      <div className="risk-line">

        <div
          className="risk-fill"
          style={{
            width: `${score ?? 0}%`
          }}
        />

      </div>


      <div className="risk-metrics">


        <div>

          <span>
            SYNTHETIC
          </span>

          <strong>

            {deepfake !== null
              ? `${deepfake}%`
              : "--"}

          </strong>

        </div>


        <div>

          <span>
            SPEAKER MATCH
          </span>

          <strong>
            N/A
          </strong>

        </div>


        <div>

          <span>
            CALLER TRUST
          </span>

          <strong>

            {score === null
              ? "--"
              : level === "LOW"
                ? "TRUSTED"
                : "REVIEW"}

          </strong>

        </div>


      </div>


      <div className="risk-state">

        {level}

      </div>


      {duration !== null && (

        <div
          style={{
            marginTop: "18px",
            fontSize: "10px",
            letterSpacing: "2px",
            color: "#77736d"
          }}
        >

          AUDIO DURATION: {duration}s

        </div>

      )}


    </div>

  );

}


export default RiskHUD;