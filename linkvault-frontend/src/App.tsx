import Landing from './pages/landing/Landing.tsx';
import Login from './pages/login/Login.tsx';
import Dashboard from './pages/dashboard/dashboard.tsx';
import Register from './pages/register/Register.tsx';
import { Routes, Route } from 'react-router';
import { useState } from 'react';
import type { User } from './lib/types/index';
import { UserContext } from './context.tsx';
//import './App.css'

function App() {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext value={user}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="login" element={<Login setUser={setUser} />} />
        <Route path="register" element={<Register/>} />
        <Route path="dashboard" element={<Dashboard/>} />
      </Routes>
    </UserContext>
  )
}

export default App
