import { useState, useEffect, useRef, useContext } from "react";
import { MessageContext, ErrorTextContext } from '../../context';
import { register } from '../../lib/api/auth';
import { BackButton } from '../../components';
import { showError, hideError } from "../../lib/utils/errors";
import { validateRegistrationFields } from "../../lib/utils/validate";
import './Register.css';
import { useNavigate } from "react-router";


type RegistrationState = "register" | "email_verification_message";

function Register() {
    const [state, setState] = useState<RegistrationState>("register");
    const [messageText, setMessageText] = useState<string>("");

    return (
        <>
            <BackButton/>
            <MessageContext value={{ message: messageText, update: setMessageText}}>
                { state === "register" ? <RegistrationForm setState={setState}/> : <EmailVerificationMessage/> }
            </MessageContext>
        </>
    );
}

export default Register;

type RegistrationFormProps = {
    setState: React.Dispatch<React.SetStateAction<RegistrationState>>;
}

function RegistrationForm({ setState,}: RegistrationFormProps) {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [password_conf, setPasswordConf] = useState<string>("");
    const [showErrorText, setShowErrorText] = useState<boolean>(false);
    const [errorText, setErrorText] = useState<string>("");

    const emailInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const inputValues: RegistrationFormInputValues = {email, password, password_conf};

    useEffect(() => {
        if (emailInputRef.current) {
            emailInputRef.current.focus();
        }
    }, []);

    return (
        <div className="register-container">
            <div className="form-container">
                <ErrorTextContext value={{errorText: errorText, updateErrorText: setErrorText, showErrorText: showErrorText, updateShowErrorText: setShowErrorText}}>
                    <h1>Create an Account</h1>
                    <form ref={formRef} onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            if (buttonRef.current) {
                                buttonRef.current.click();
                            }
                        }}}>
                        { showErrorText === true ? <h2>{errorText}</h2> : null }
                        <AuthInput label={"Email:"} callBack={setEmail}/>
                        <AuthInput label={"Password:"} callBack={setPassword}/>
                        <AuthInput label={"Confirm password:"} callBack={setPasswordConf}/>
                        <SubmitButton inputValues={inputValues} buttonRef={buttonRef} setRegisterState={setState}/>
                    </form>
                </ErrorTextContext>
            </div>
        </div>
    );
}

type AuthInputProps = {
    label: string;
    callBack: React.Dispatch<React.SetStateAction<string>>;
};

function AuthInput({
    label,
    callBack,
}: AuthInputProps) {
    const errorTextContext = useContext(ErrorTextContext);
    const showErrorText = errorTextContext.showErrorText;

    return (
        <div className="auth-input" style={{ paddingBottom: "30px" }}>
            <div className="auth-input-label-container">
                <label htmlFor="password">{label}</label>
                { showErrorText === true ? <label className="required-field-label">*</label> : null }
            </div>
            <br/>
            <input type="password" id="password" name="user-password" placeholder="••••••••••••••••" onChange={e => callBack(e.target.value)}/>
        </div>
    )
}

function EmailVerificationMessage() {
    const navigate = useNavigate();
    const messageContext = useContext(MessageContext);
    
    return (
        <div className="verify-container">
            <span className="verification-message">
                A verification email has been sent to {messageContext.message}<br/><br/>
                Please check your inbox for a verification link.
            </span>
            <button className="login-btn-register" onClick={() => {navigate("../login")}}>Sign in</button>
        </div>
    );
}

export type RegistrationFormInputValues = {
    email: string;
    password: string;
    password_conf: string;
};

type SubmitButtonProps = {
    inputValues: RegistrationFormInputValues;
    buttonRef: React.RefObject<HTMLButtonElement | null>;
    setRegisterState: React.Dispatch<React.SetStateAction<RegistrationState>>;
};

type SubmitState = "enabled" | "disabled";

function SubmitButton({
    inputValues,
    buttonRef,
    setRegisterState,
}: SubmitButtonProps) {
    const [state, setState] = useState<SubmitState>("enabled");
    const [label, setLabel] = useState("Submit");
    const messageContext = useContext(MessageContext);
    const errorTextContext = useContext(ErrorTextContext);

    async function clickHandler() {
        setState("disabled");
        setLabel("Creating account...");
        const isInvalid = validateRegistrationFields(inputValues);
        if (isInvalid) {
            showError(isInvalid, errorTextContext);
        } else {
            const message = await register(inputValues.email, inputValues.password);
            
            if (message) {
                messageContext.update(message);
                hideError(errorTextContext);
                setRegisterState("email_verification_message");
            } else {
                showError("Internal server error", errorTextContext);
            }
        }
        setLabel("Submit");
        setState("enabled");
    }

    return (
        <div className="submit-container">
            <button className='submit-btn' disabled={state === "disabled"} type="button" ref={buttonRef} onClick={clickHandler}>{label}</button>
        </div>
    );
}
