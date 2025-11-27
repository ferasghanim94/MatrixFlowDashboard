import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AttributionFlow from './pages/AttributionFlow';
import OfflineConversions from './pages/OfflineConversions';
import CompanyFunnel from './pages/CompanyFunnel';
import PaymentsFlow from './pages/PaymentsFlow';
import DataQuality from './pages/DataQuality';
import HubspotPushFlow from './pages/HubspotPushFlow';
import HubspotPullFlow from './pages/HubspotPullFlow';
import HubspotScheduledFlow from './pages/HubspotScheduledFlow';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/attribution" element={<AttributionFlow />} />
          <Route path="/offline-conversions" element={<OfflineConversions />} />
          <Route path="/company-funnel" element={<CompanyFunnel />} />
          <Route path="/payments" element={<PaymentsFlow />} />
          <Route path="/data-quality" element={<DataQuality />} />
          <Route path="/hubspot/push" element={<HubspotPushFlow />} />
          <Route path="/hubspot/pull" element={<HubspotPullFlow />} />
          <Route path="/hubspot/scheduled" element={<HubspotScheduledFlow />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
