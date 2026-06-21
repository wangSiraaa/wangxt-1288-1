import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ToiletList from './pages/ToiletList';
import ScheduleList from './pages/ScheduleList';
import CheckInList from './pages/CheckInList';
import SupplyList from './pages/SupplyList';
import RepairList from './pages/RepairList';
import ComplaintList from './pages/ComplaintList';
import AlertList from './pages/AlertList';
import UserList from './pages/UserList';

const App: React.FC = () => {
  const token = localStorage.getItem('token');

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={token ? <MainLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="toilets" element={<ToiletList />} />
        <Route path="schedules" element={<ScheduleList />} />
        <Route path="check-ins" element={<CheckInList />} />
        <Route path="supplies" element={<SupplyList />} />
        <Route path="repairs" element={<RepairList />} />
        <Route path="complaints" element={<ComplaintList />} />
        <Route path="alerts" element={<AlertList />} />
        <Route path="users" element={<UserList />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
