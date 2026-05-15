import { useNavigate } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import { login } from "../../lib/api/auth";
import { BackButton } from '../../components';
import type { User } from '../../lib/types/index';
import './Login.css';

type LoginProps = {
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

function Login({
    setUser,
}: LoginProps) {
    return (
        <>
            <BackButton/>
            <LoginForm setUser={setUser}/>
        </>
    );
}

export default Login;




function LoginForm({
    setUser,
}: LoginProps) {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <div id="login-container">
            <div id="form-container">
                <h1>Login</h1>
                <div id="submit-btn-container">
                    <div className="auth-input" style={{ paddingBottom: "60px" }}>
                        <label htmlFor="email">Email:</label><br/>
                        <input type="text" ref={inputRef} name="user-email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}/>
                    </div>
                    <div className="auth-input">
                        <label htmlFor="password">Password:</label><br/>
                        <input type="password" name="user-password" placeholder="••••••••••••••••" value={password} onChange={e => setPassword(e.target.value)}/>
                    </div>
                    <div id="error-msg-container">
                        <p id="error-msg"></p>
                    </div>
                    <SubmitButton email={email} password={password} setUser={setUser}/>
                </div>
            </div>
        </div>
    );
}

type SubmitButtonProps = {
    email: string;
    password: string;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;

};

function SubmitButton({
    email,
    password,
    setUser,
}: SubmitButtonProps) {
    const navigate = useNavigate()
    async function clickHandler() {
        const user = await login(email, password);
        
        if (user) {
            setUser(user);
            navigate("dashboard");
        } else {
            alert("Login failed")
        }
    }

    return (
        <div className="submit-container">
            <button className="submit-btn" onClick={clickHandler}>Submit</button>
        </div>
    )
}
