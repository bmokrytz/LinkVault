import "./Landing.css";
import { useNavigate } from "react-router";
import { useContext, useEffect } from "react";
import { TitleContext } from "../../context";

function Landing() {
  const titleContext = useContext(TitleContext);

  useEffect(() => {
    titleContext.setTitle("LinkVault");
  }, []);

  return (
    <>
      <div className="content-container">
        <div className="landing-title">
          <h1>LinkVault</h1>
        </div>
        <div className="landing-text">
          <p>Your personal bookmark manager. Save, organize, and retrieve your links — privately.</p>
        </div>
        <div className="buttons-container">
            <RegisterButton />
            <LoginButton />
        </div>
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


export default Landing;
