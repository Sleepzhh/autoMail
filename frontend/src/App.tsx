import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import MailAccountsPage from './pages/MailAccountsPage';
import AutomationFlowsPage from './pages/AutomationFlowsPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* OAuth callback without Layout wrapper */}
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        {/* Main app routes with Layout */}
        <Route
          path="/"
          element={
            <Layout>
              <MailAccountsPage />
            </Layout>
          }
        />
        <Route
          path="/automation-flows"
          element={
            <Layout>
              <AutomationFlowsPage />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
