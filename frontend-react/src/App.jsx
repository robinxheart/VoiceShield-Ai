import { useEffect, useState } from "react";
import LiveAnalyzer from "./components/LiveAnalyzer";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import { supabase } from "./supabaseClient";

function App() {

  const [verificationOpen, setVerificationOpen] = useState(false);
  const [securityMessage, setSecurityMessage] = useState("");
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  useEffect(() => {
  let mounted = true;

  const loadSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (mounted) {
      setSession(session);
      setAuthLoading(false);
    }
  };

  loadSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);
    }
  );

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [analysisResult, setAnalysisResult] =
    useState(null);
  const [activityReports, setActivityReports] = useState([]);


  const handleAnalysisResult = (data) => {

    console.log(
      "VOICE SHIELD RESULT:",
      data
    );

    setAnalysisResult(data);

    loadActivityReports();

  };

  const loadActivityReports = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data, error } = await supabase
    .from("call_sessions")
    .select(
      "id, created_at, final_risk, level, status"
    )
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    })
    .limit(5);

  if (error) {
    console.error(
      "ACTIVITY LOAD ERROR:",
      error
    );
    return;
  }

  setActivityReports(data || []);
};

useEffect(() => {
  if (session) {
    loadActivityReports();
  }
}, [session]);

if (authLoading) {
  return (
    <main className="login-page">
      <div className="login-system-status">
        <span className="status-dot"></span>
        AUTHENTICATING...
      </div>
    </main>
  );
}

if (!session) {
  return <Login />;
}

if (currentPage === "reports") {
  return (
    <>
      <button
        type="button"
        className="back-dashboard-button"
        onClick={() => setCurrentPage("dashboard")}
      >
        ← BACK TO DASHBOARD
      </button>

      <Reports />
    </>
  );
}

  return (

  <main
  className={`app ${
    analysisResult
      ? `risk-${analysisResult.level.toLowerCase()}`
      : ""
  }`}
>

     <header className="topbar">
  <div>
    <h1 className="brand-main">
  VOICE<span>SHIELD</span>
</h1>
    <p>AI SECURITY OPS</p>
  </div>

  <div className="topbar-actions">
    <div className="system-status">
      <span className="status-dot"></span>
      SYSTEM ONLINE
    </div>

    <button
      type="button"
      className="reports-nav-button"
      onClick={() => setCurrentPage("reports")}
    >
      REPORTS →
    </button>

    <button
      type="button"
      className="logout-button"
    onClick={async () => {
  await supabase.auth.signOut();
  setCurrentPage("dashboard");
  setAnalysisResult(null);
}}
    >
      LOGOUT
    </button>
  </div>
</header>


      <section className="hero">

        <div className="hero-content">

          <small>
            SECURITY MISSION // 26104
          </small>

          <h2>
            VOICE
            <br />
            <em>UNDER</em>
            <br />
            ATTACK?
          </h2>

          <p>
            Detect suspicious synthetic speech
            before a trusted voice becomes an
            irreversible action.
          </p>


          <div className="hero-actions">

            <button
              className="primary-button"
              onClick={() =>
                document
                  .getElementById("live-section")
                  ?.scrollIntoView({
                    behavior: "smooth"
                  })
              }
            >

              START ANALYSIS

              <span>→</span>

            </button>


            <button
  type="button"
  className="secondary-button"
  onClick={() =>
    document
      .getElementById("how-it-works")
      ?.scrollIntoView({
        behavior: "smooth"
      })
  }
>
  HOW IT WORKS
</button>

          </div>

        </div>


        <div className="hero-risk">

          <small>
            LIVE THREAT LEVEL
          </small>


          <div
  className={`risk-bar ${
    analysisResult?.level
      ? analysisResult.level.toLowerCase()
      : ""
  }`}
>
  <div
    style={{
      width: `${analysisResult?.final_risk ?? 0}%`
    }}
  />
</div>

          <div className="risk-values">

            <div>

              <span>
                SYNTHETIC
              </span>

              <strong>
                {
                  analysisResult
                    ? `${analysisResult.aasist_spoof_score}%`
                    : "--"
                }
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
                {
                  analysisResult
                    ? analysisResult.level
                    : "--"
                }
              </strong>

            </div>

          </div>


          <div
  className={`risk-label ${
    analysisResult?.level
      ? analysisResult.level.toLowerCase()
      : ""
  }`}
>
  {analysisResult
    ? `${analysisResult.final_risk}/100 — ${analysisResult.level}`
    : "AWAITING ANALYSIS"}
</div>

        </div>

      </section>


      <section
        id="live-section"
        className="analysis-section"
      >

        <div className="section-heading">

          <small>
            01 // LIVE VOICE INTERCEPT
          </small>

          <h2>
            ANALYZE
            <br />
            <span>THE VOICE</span>
          </h2>

        </div>


        <div className="analysis-card">

          <div className="analysis-card-header">

            <span>
              REAL-TIME MICROPHONE ANALYSIS
            </span>

            <span>
              AASIST ENGINE
            </span>

          </div>


          <LiveAnalyzer
            onResult={
              handleAnalysisResult
            }
          />


          {
            analysisResult && (

              <div
  className={`result-panel ${
    analysisResult.level.toLowerCase()
  }`}
>

                <div>
                

                  <span>
                    RISK SCORE
                  </span>

                  <strong>
                    {
                      analysisResult.final_risk
                    }
                    /100
                  </strong>

                </div>


                <div>

                  <span>
                    RISK CLASSIFICATION
                  </span>

                  <strong>
                    {
                      analysisResult.level
                    }
                  </strong>

                </div>


                <div>
  <span>
    AASIST SPOOF SCORE
  </span>

  <strong>
    {analysisResult.aasist_spoof_score}%
  </strong>
</div>

<div>
  <span>
    BONA-FIDE SCORE
  </span>

  <strong>
    {analysisResult.bona_fide_probability}%
  </strong>
</div>

              </div>


            )

          }

          {analysisResult && (
  <div className="analysis-details">
    <div className="analysis-details-header">
      <span>ANALYSIS DETAILS</span>
      <span>VOICE DATA</span>
    </div>

    <div className="analysis-details-grid">

      <div>
        <small>DURATION</small>
        <strong>
          {Number(
            analysisResult.duration_seconds || 0
          ).toFixed(2)} SEC
        </strong>
      </div>

      <div>
        <small>SAMPLE RATE</small>
        <strong>
          {analysisResult.sample_rate || "--"} Hz
        </strong>
      </div>

      <div>
        <small>MODEL</small>
        <strong>
          {analysisResult.model || "AASIST"}
        </strong>
      </div>

      <div>
        <small>FILE</small>
        <strong>
          {analysisResult.filename || "N/A"}
        </strong>
      </div>

      <div>
        <small>STATUS</small>
        <strong>ANALYSIS COMPLETE</strong>
      </div>

    </div>
  </div>
)}

 {analysisResult && (
  <div className="threat-signals">
    <div className="threat-header">
      <span>THREAT SIGNALS</span>
      <span>AASIST ENGINE</span>
    </div>

    <div className="signal-row">
      <span>AASIST SPOOF SIGNAL</span>
      <strong>
        {analysisResult.aasist_spoof_score >= 75
          ? "CRITICAL"
          : analysisResult.aasist_spoof_score >= 50
            ? "HIGH"
            : analysisResult.aasist_spoof_score >= 25
              ? "MEDIUM"
              : "LOW"}
      </strong>
    </div>

    <div className="signal-row">
      <span>SPEAKER MATCH</span>
      <strong>NOT CHECKED</strong>
    </div>

    <div className="signal-row">
      <span>PROSODY ANOMALY</span>
      <strong>NOT AVAILABLE</strong>
    </div>

    <div className="signal-row">
      <span>CONTEXT RISK</span>
      <strong>NOT AVAILABLE</strong>
    </div>

    <div className="recommendation">
      <small>RECOMMENDATION</small>
      <strong>
        {analysisResult.final_risk >= 75
          ? "SECONDARY VERIFICATION REQUIRED"
          : analysisResult.final_risk >= 50
            ? "MANUAL REVIEW RECOMMENDED"
            : "VOICE SIGNAL WITHIN LOWER RISK RANGE"}
      </strong>
    </div>
  </div>
)}

{analysisResult && (
  <div className="security-action">
    <div className="security-action-header">
      <span>SECURITY ACTION</span>
      <span>TRANSFER CONTROL</span>
    </div>

    <div className="security-action-body">
      <div>
        <small>REQUESTED ACTION</small>
        <strong>APPROVE SENSITIVE TRANSFER</strong>
      </div>

      <button
        className={
          analysisResult.final_risk >= 50
            ? "action-button locked"
            : "action-button"
        }
        disabled={analysisResult.final_risk >= 50}
        onClick={() => {
  setSecurityMessage(
    "TRANSFER APPROVAL INITIATED."
  );
}}
      >
        {analysisResult.final_risk >= 50
          ? "🔒 ACTION LOCKED"
          : "APPROVE TRANSFER →"}
      </button>
    </div>

{analysisResult.final_risk >= 50 && (
  <div className="verification-required">
    <span>⚠</span>

    <div className="verification-content">
      <strong>SECONDARY VERIFICATION REQUIRED</strong>

      <p>
        Voice risk is above the safe-action threshold.
        Verify the caller through an independent channel
        before proceeding.
      </p>

      <button
        type="button"
        className="verify-button"
        onClick={() => setVerificationOpen(true)}
      >
        VERIFY CALLER →
      </button>
    </div>
  </div>
)}
  </div>
)}

<section className="security-activity-section">
  <div className="section-heading">
    <small>03 // SECURITY ACTIVITY</small>

    <h2>
      RECENT
      <br />
      <span>ACTIVITY</span>
    </h2>
  </div>

  <div className="security-activity-card">

    <div className="security-activity-header">
      <span>VOICE ANALYSIS LOG</span>
      <span>LIVE FEED</span>
    </div>

    {activityReports.length === 0 ? (
      <div className="activity-empty">
        NO RECENT ANALYSIS ACTIVITY.
      </div>
    ) : (
      activityReports.map((report) => (
        <div
          className="activity-row"
          key={report.id}
        >
          <div className="activity-time">
            {new Date(
              report.created_at
            ).toLocaleTimeString()}
          </div>

          <div className="activity-info">
            <strong>VOICE ANALYSIS</strong>
            <small>
              AASIST // RISK SCORE{" "}
              {Number(
                report.final_risk || 0
              ).toFixed(2)}
            </small>
          </div>

          <div
            className={`activity-level ${
              report.level
                ? report.level.toLowerCase()
                : ""
            }`}
          >
            {report.level || "UNKNOWN"}
          </div>

          <div className="activity-status">
            {report.status || "UNKNOWN"}
          </div>
        </div>
      ))
    )}

  </div>
</section>

        </div>

      </section>
<section
  id="how-it-works"
  className="how-it-works-section"
>
  <div className="section-heading">
    <small>02 // SECURITY PROCESS</small>

    <h2>
      HOW IT
      <br />
      <span>WORKS</span>
    </h2>
  </div>

  <div className="how-it-works-grid">

    <div className="process-card">
      <span>01</span>
      <h3>CAPTURE</h3>
      <p>
        Voice audio is captured through the
        operator microphone for analysis.
      </p>
    </div>

    <div className="process-card">
      <span>02</span>
      <h3>ANALYZE</h3>
      <p>
        The audio is processed by the
        AASIST voice anti-spoofing engine.
      </p>
    </div>

    <div className="process-card">
      <span>03</span>
      <h3>ASSESS</h3>
      <p>
        The system calculates a model-derived
        spoof score and overall risk level.
      </p>
    </div>

    <div className="process-card">
      <span>04</span>
      <h3>PROTECT</h3>
      <p>
        High-risk results can trigger
        additional verification before action.
      </p>
    </div>

  </div>
</section>

      <footer>

        VOICESHIELD AI

        <span>
          REAL-TIME VOICE INTEGRITY
        </span>

      </footer>

{verificationOpen && (
  <div className="verification-overlay">
    <div className="verification-modal">
      <div className="verification-header">
        <span>SECURITY PROTOCOL</span>
        <button
          type="button"
          onClick={() => setVerificationOpen(false)}
        >
          ×
        </button>
      </div>

      <div className="verification-body">
        <div className="verification-icon">⚠</div>

        <small>VOICE INTEGRITY CHECK</small>

        <h2>SECONDARY<br />VERIFICATION</h2>

        <p>
          The caller's voice has been flagged as high risk.
          Confirm the caller through an independent channel
          before approving the requested action.
        </p>

        <div className="verification-status">
          <span>THREAT LEVEL</span>
          <strong>
            {analysisResult?.level || "HIGH RISK"}
          </strong>
        </div>

        <div className="verification-status">
          <span>VOICE RISK</span>
          <strong>
            {analysisResult?.final_risk ?? "--"}/100
          </strong>
        </div>

        <button
          type="button"
          className="verify-confirm-button"
          onClick={() => {
  setVerificationOpen(false);

  setSecurityMessage(
    "VERIFICATION REQUEST INITIATED. CONFIRM THE CALLER THROUGH AN INDEPENDENT CHANNEL."
  );

  setTimeout(() => {
    setSecurityMessage("");
  }, 5000);
}}
  
        >
          INITIATE VERIFICATION →
        </button>

        <button
          type="button"
          className="verify-cancel-button"
          onClick={() => setVerificationOpen(false)}
        >
          CANCEL
        </button>
      </div>
    </div>
  </div>
)}

{securityMessage && (
  <div className="security-message">
    <div className="security-message-icon">
      ✓
    </div>

    <div className="security-message-content">
      <small>SECURITY PROTOCOL</small>

      <strong>
        {securityMessage}
      </strong>
    </div>

    <button
      type="button"
      onClick={() => setSecurityMessage("")}
      aria-label="Close security message"
    >
      ×
    </button>
  </div>
)}

    </main>

  );

}

export default App;