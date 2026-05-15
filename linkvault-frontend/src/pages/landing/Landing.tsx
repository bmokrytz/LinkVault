import "./Landing.css";
import { useNavigate } from "react-router";

function Landing() {

  return (
    <>
      <div id="landing-title">
        <h1>LinkVault</h1>
      </div>
      <div id="landing-text">
        <p>Your personal bookmark manager. Save, organize, and retrieve your links — privately.</p>
      </div>
      <div id="buttons-container">
          <RegisterButton />
          <LoginButton />
      </div>
    </>
  )
}



function RegisterButton() {
  const navigate = useNavigate()
  function clickHandler() {
    navigate('/register');
  }

  return (
    <>
      <button className="register-btn" onClick={clickHandler}>Get Started</button>
    </>
  )
}

function LoginButton() {
  const navigate = useNavigate()
  function clickHandler() {
    navigate('/login');
  }

  return (
    <>
      <button className="login-btn-landing" onClick={clickHandler}>Sign in</button>
    </>
  )
}


export default Landing

