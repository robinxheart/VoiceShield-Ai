import { useState } from "react";
import { supabase } from "../supabaseClient";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

const handleSubmit = async (event) => {
  event.preventDefault();

  if (!email || !password) {
  setErrorMessage("ENTER AN EMAIL AND PASSWORD FIRST.");
  return;
}

setErrorMessage("");
setSuccessMessage("");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

 if (error) {
  if (
    error.message.toLowerCase().includes("email not confirmed")
  ) {
    setErrorMessage(
      "EMAIL VERIFICATION REQUIRED. CHECK YOUR INBOX."
    );
  } else {
    setErrorMessage(error.message.toUpperCase());
  }

  return;
}

};

  return (
    <main className="login-page">
      <div className="login-grid">
        <section className="login-intro">
          <small>VOICE SECURITY // ACCESS CONTROL</small>

          <h1>
            VOICE
            <br />
            <span>SHIELD</span>
          </h1>

          <p>
            AI-powered voice integrity monitoring
            for high-risk conversations.
          </p>

          <div className="login-system-status">
            <span className="status-dot"></span>
            SECURITY SYSTEM ONLINE
          </div>
        </section>

        <section className="login-card">
          <div className="login-card-header">
            <span>SECURE ACCESS</span>
            <span>VS // 26104</span>
          </div>

          <div className="login-card-body">
            <small>OPERATOR LOGIN</small>

            <h2>
              ENTER
              <br />
              <span>CONTROL ROOM</span>
            </h2>

            {errorMessage && (
  <div className="login-error">
    <span className="login-error-icon">!</span>

    <strong>{errorMessage}</strong>

    <button
      type="button"
      onClick={() => setErrorMessage("")}
      aria-label="Close error"
    >
      ×
    </button>
  </div>
)}

{successMessage && (
  <div className="login-success">
    <span className="login-success-icon">✓</span>

    <strong>{successMessage}</strong>

    <button
      type="button"
      onClick={() => setSuccessMessage("")}
      aria-label="Close success message"
    >
      ×
    </button>
  </div>
)}

            <form onSubmit={handleSubmit}>
              <label>
                EMAIL ADDRESS
                <input
                  type="email"
                  placeholder="operator@voiceshield.ai"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                />
              </label>

              <label>
                PASSWORD
                <div className="password-input-wrapper">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Enter your password"
    value={password}
    onChange={(event) =>
      setPassword(event.target.value)
    }
  />

  <button
    type="button"
    className="password-toggle"
    onClick={() =>
      setShowPassword((current) => !current)
    }
    aria-label={
      showPassword
        ? "Hide password"
        : "Show password"
    }
  >
    {showPassword ? "HIDE" : "SHOW"}
  </button>
</div>
              </label>

              <button
                type="submit"
                className="login-button"
              >
                ACCESS CONTROL ROOM →
              </button>

              <button
  type="button"
  className="signup-button"
  onClick={async () => {
    if (!email || !password) {
  setErrorMessage("ENTER AN EMAIL AND PASSWORD FIRST.");
  return;
}

setErrorMessage("");
setSuccessMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
  setErrorMessage(error.message.toUpperCase());
  return;
}

    setSuccessMessage(
  "ACCOUNT CREATED. CHECK YOUR INBOX TO VERIFY YOUR EMAIL."
);
  }}
>
  CREATE NEW OPERATOR ACCOUNT
</button>

            </form>

            <div className="login-warning">
              <span>⚠</span>
              <p>
                Authorized security personnel only.
                Voice analysis systems may process
                sensitive communication data.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer>
        VOICESHIELD AI
        <span>SECURE VOICE INTEGRITY PLATFORM</span>
      </footer>
    </main>
  );
}

export default Login;