import { useState } from "react";

import Hero from "../components/Hero";
import LiveFeed from "../components/LiveFeed";


function Dashboard() {

  const [risk, setRisk] = useState(null);


  const handleAnalysisResult = (data) => {

    console.log(
      "DASHBOARD RECEIVED:",
      data
    );

    setRisk(data);

  };


  return (

    <div className="dashboard">

      <Hero
        risk={risk}
        onAnalysisResult={handleAnalysisResult}
      />

      <LiveFeed />

    </div>

  );

}

export default Dashboard;