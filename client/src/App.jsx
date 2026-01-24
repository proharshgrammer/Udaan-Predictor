import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import HomePage from './pages/HomePage';
import PredictorPage from './pages/PredictorPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';

import CounsellingPage from './pages/CounsellingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="counselling" element={<CounsellingPage />} />
          <Route path="predict" element={<PredictorPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="admin" element={<AdminPage />} />
          {/* Add more routes here */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
