import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage("NO AUTHENTICATED USER FOUND.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("call_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("REPORTS LOAD ERROR:", error);
        setErrorMessage("UNABLE TO LOAD SECURITY REPORTS.");
        setLoading(false);
        return;
      }

      setReports(data || []);
      setLoading(false);
    };

    loadReports();
  }, []);

  const totalAnalyses = reports.length;

  const threatsDetected = reports.filter(
    (report) => Number(report.final_risk) >= 50
  ).length;

  const cleared = reports.filter(
    (report) => Number(report.final_risk) < 50
  ).length;

  const averageRisk =
    totalAnalyses > 0
      ? reports.reduce(
          (sum, report) => sum + Number(report.final_risk || 0),
          0
        ) / totalAnalyses
      : 0;

  const filteredReports =
    filter === "ALL"
      ? reports
      : reports.filter((report) => report.level === filter);

  return (
    <main className="reports-page">
      <section className="reports-header">
        <small>VOICE SECURITY // ANALYSIS HISTORY</small>

        <h1>
          SECURITY
          <br />
          <span>REPORTS</span>
        </h1>

        <p>
          Historical voice integrity analysis records
          from the secure control room.
        </p>
      </section>

      {loading && (
        <div className="reports-message">
          LOADING SECURITY REPORTS...
        </div>
      )}

      {errorMessage && (
        <div className="reports-error">
          {errorMessage}
        </div>
      )}

      {!loading && !errorMessage && (
        <>
          {/* SUMMARY */}
          <section className="reports-summary">
            <div className="summary-card">
              <small>TOTAL ANALYSES</small>
              <strong>{totalAnalyses}</strong>
            </div>

            <div className="summary-card">
              <small>THREATS DETECTED</small>
              <strong>{threatsDetected}</strong>
            </div>

            <div className="summary-card">
              <small>CLEARED</small>
              <strong>{cleared}</strong>
            </div>

            <div className="summary-card">
              <small>AVERAGE RISK</small>
              <strong>{averageRisk.toFixed(2)}%</strong>
            </div>
          </section>

          {/* FILTER */}
          <section className="reports-filter">
            <span>FILTER RISK LEVEL</span>

            <div className="filter-buttons">
              {["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map(
                (level) => (
                  <button
                    key={level}
                    type="button"
                    className={
                      filter === level
                        ? "filter-button active"
                        : "filter-button"
                    }
                    onClick={() => setFilter(level)}
                  >
                    {level}
                  </button>
                )
              )}
            </div>
          </section>

          {filteredReports.length === 0 ? (
            <div className="reports-message">
              NO REPORTS MATCH THE SELECTED FILTER.
            </div>
          ) : (
            <section className="reports-list">
              {filteredReports.map((report, index) => (
                <article
                  className="report-card"
                  key={report.id}
                >
                  <div className="report-card-header">
                    <strong>
                      VS-{String(reports.length - index).padStart(
                        3,
                        "0"
                      )}
                    </strong>

                    <span>{report.level}</span>
                  </div>

                  <div className="report-card-body">
                    <div className="report-item">
                      <small>TIME</small>
                      <strong>
                        {new Date(
                          report.created_at
                        ).toLocaleString()}
                      </strong>
                    </div>

                    <div className="report-item">
                      <small>FILENAME</small>
                      <strong>
                        {report.filename || "N/A"}
                      </strong>
                    </div>

                    <div className="report-item">
                      <small>RISK SCORE</small>
                      <strong>
                        {Number(report.final_risk).toFixed(2)}%
                      </strong>
                    </div>

                    <div className="report-item">
                      <small>MODEL</small>
                      <strong>
                        {report.model || "AASIST"}
                      </strong>
                    </div>

                    <div className="report-item">
                      <small>DURATION</small>
                      <strong>
                        {Number(
                          report.duration_seconds || 0
                        ).toFixed(2)} SEC
                      </strong>
                    </div>

                    <div className="report-item">
                      <small>STATUS</small>
                      <strong>
                        {report.status || "UNKNOWN"}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default Reports;