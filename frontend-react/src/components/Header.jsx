function Header() {
  return (
    <header className="topbar">

      <div className="brand">
        <div className="brand-main">
          VOICE<span>SHIELD</span>
        </div>

        <div className="brand-sub">
          AI SECURITY OPS
        </div>
      </div>

      <div className="system-status">
        <span className="status-dot"></span>
        SYSTEM ONLINE
      </div>

      <div className="clock">
        20:00:00
      </div>

      <button className="menu-button">
        <span></span>
        <span></span>
        <span></span>
      </button>

    </header>
  );
}

export default Header;