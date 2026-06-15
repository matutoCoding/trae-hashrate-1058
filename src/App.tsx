import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Settings from "@/pages/Settings";
import Radiant from "@/pages/Radiant";
import Observation from "@/pages/Observation";
import Records from "@/pages/Records";
import Archive from "@/pages/Archive";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Settings />} />
          <Route path="/radiant" element={<Radiant />} />
          <Route path="/observation" element={<Observation />} />
          <Route path="/records" element={<Records />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
