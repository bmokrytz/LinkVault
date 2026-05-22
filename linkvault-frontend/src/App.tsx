import Landing from './pages/landing/Landing.tsx';
import Login from './pages/login/Login.tsx';
import Dashboard from './pages/dashboard/Dashboard.tsx';
import Register from './pages/register/Register.tsx';
import Verify from './pages/verify/verify.tsx';
import { Routes, Route } from 'react-router';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { useState } from 'react';
import type { User } from './lib/types/index';
import { UserContext, TitleContext } from './context.tsx';

function App() {
  const [title, setTitle] = useState<string>("");
  const [user, setUser] = useState<User | null>(() => {
    const id = localStorage.getItem("id");
    const email = localStorage.getItem("email");
    const token = localStorage.getItem("token");

    if (id && email && token) {
      return { id, email, token }
    }
    
    return null;
  });

  return (
    <HelmetProvider>
      <title>{title}</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=arrow_outward,check,delete,edit,link,link_2,settings"/>
      <TitleContext value={{setTitle}}>
        <UserContext value={{user, setUser}}>
          <Routes>
            <Route path="/" element={<Landing/>} />
            <Route path="login" element={<Login/>} />
            <Route path="register" element={<Register/>} />
            <Route path="dashboard" element={<Dashboard/>} />
            <Route path="verify/:verification_token" element={<Verify/>} />
          </Routes>
        </UserContext>
      </TitleContext>
    </HelmetProvider>
  )
}

export default App
