import { useNavigate } from 'react-router';
import { useState, useRef, useContext, useEffect } from 'react';
import { ErrorTextContext, UserContext, TitleContext, VerificationContext } from '../../context';
import { showError, hideError } from '../../lib/utils/errors';
import { validateFormFields } from '../../lib/utils/validate';
import { login, resendVerification } from "../../lib/api/auth";
import { isVerificationTokenPayload } from "../../lib/utils/validate";
import { BackButton, AuthInput } from '../../components';
import './Login.css';
import type { User, VerificationTokenPayload } from '../../lib/types';


function Login() {
    const [showErrorText, setShowErrorText] = useState<boolean>(false);
    const [errorText, setErrorText] = useState<string>("");
    const [verified, setVerified] = useState<boolean>(true);
    const [verificationToken, setVerificationToken] = useState<string>("");
    const [email, setLoginEmail] = useState<string>("");
    const titleContext = useContext(TitleContext);
    
      useEffect(() => {
        titleContext.setTitle("LinkVault - Login");
      }, []);

    return (
        <>
            <div className="content-container">
                <BackButton/>
                <VerificationContext value={{email, setLoginEmail, setVerified, verificationToken, setVerificationToken}}>
                    {verified 
                    ?   <ErrorTextContext value={{errorText: errorText, setErrorText: setErrorText, showErrorText: showErrorText, setShowErrorText: setShowErrorText}}>
                            <LoginForm/>
                        </ErrorTextContext>
                    :   <Unverified/>
                    }
                </VerificationContext>
                    
            </div>
        </>
    );
}

export default Login;




function LoginForm() {
    const [password, setPassword] = useState<string>("");
    const errorContext = useContext(ErrorTextContext);
    const verificationContext = useContext(VerificationContext);

    const emailInputRef = useRef<HTMLInputElement>(null);
    const submitButtonRef = useRef<HTMLButtonElement>(null);

    return (
        <div id="login-container">
            <div className="form-container">
                <h1>Login</h1>
                <form onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        if (submitButtonRef.current) {
                            submitButtonRef.current.click();
                        }
                    }
                }}>
                    {errorContext.showErrorText ? <h2>{errorContext.errorText}</h2> : null}
                    <AuthInput label={"Email:"} ref={emailInputRef} inputType={"email"} name={"email"} callBack={verificationContext.setLoginEmail}/>
                    <AuthInput label={"Password:"} inputType={"password"} name={"password"} callBack={setPassword}/>
                    <div className="submit-btn-container">
                        <SubmitButton ref={submitButtonRef} inputValues={{email: verificationContext.email, password}} />
                    </div>
                </form>
            </div>
        </div>
    );
}

export type LoginFormInputValues = {
    email: string;
    password: string;
};

type SubmitButtonProps = {
    inputValues: LoginFormInputValues;
    ref?: React.RefObject<HTMLButtonElement | null>;
};

type SubmitState = "enabled" | "disabled";

function SubmitButton({
    inputValues,
    ref,
}: SubmitButtonProps) {
    const navigate = useNavigate();
    const [state, setState] = useState<SubmitState>("enabled");
    const [label, setLabel] = useState("Submit");
    const errorContext = useContext(ErrorTextContext);
    const userContext = useContext(UserContext);
    const verificationContext = useContext(VerificationContext);

    async function clickHandler() {
        setState("disabled");
        setLabel("Logging in...")
        const invalid = validateFormFields(inputValues);
        if (invalid) {
            showError(invalid, errorContext);
            setLabel("Submit");
            setState("enabled");
            return;
        }

        const response = await login(inputValues.email, inputValues.password);
        
        if (response) {
            if (isVerificationTokenPayload(response)) {
                const payload = response as VerificationTokenPayload;
                verificationContext.setVerified(false);
                verificationContext.setVerificationToken(payload.verification_email_token);
                return;
            } else {
                const user = response as User;
                userContext.setUser(user);
                localStorage.setItem("id", user.id);
                localStorage.setItem("email", user.email);
                localStorage.setItem("token", user.token);
                navigate("../dashboard");
                return;
            }
        }
        showError("Login failed", errorContext);
        setLabel("Submit")
        setState("enabled");
    }

    return (
        <div className="submit-container">
            <button className="submit-btn" ref={ref} type='button' disabled={state === 'disabled'} onClick={clickHandler}>{label}</button>
        </div>
    )
}

function Unverified() {
    const [success, setSuccess] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [error, setError] = useState<boolean>(false);
    const verificationContext = useContext(VerificationContext);
    const pendingMessage = "This account has not yet been verified. Check your email inbox for a verification link or click below to send a new verification link.";
    const successMessage = `A new verification email has been sent to ${verificationContext.email}. Please check your inbox for a verification link.`;

    async function sendNewLinkButtonHandler(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        if (e.button !== 0) return;
        const response = await resendVerification(verificationContext.verificationToken);
        if (response) {
            if (response === "200") {
                setSuccess(true);
            } else {
                setErrorMessage(response);
                setError(true);
            }
        } else {
            setErrorMessage("Internal server error");
            setError(true);
        }
    }

    return (
        <div className="unverified-warning-outer-container">
            <div className="unverified-warning-inner-container">
                <span>{error
                            ? errorMessage
                            : success
                                ? successMessage
                                : pendingMessage}</span>
                <button className={(success || error) ? "send-new-link-button hidden" : "send-new-link-button"} onMouseDown={(e) => {sendNewLinkButtonHandler(e);}}>Send New Link</button>
            </div>
        </div>
    );
}
