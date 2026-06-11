import { useNavigate } from 'react-router';
import { useContext, useEffect } from 'react';
import { ErrorTextContext } from './context';

export function BackButton() {
    const navigate = useNavigate();
    return (
        <div className="back-btn-box">
            <button className="back-btn" onClick={() => { navigate("/") }}>← Back</button>
        </div>
    );
}

type AuthInputProps = {
    label: string;
    ref?: React.RefObject<HTMLInputElement | null>;
    inputType: "email" | "password";
    name: string;
    callBack: React.Dispatch<React.SetStateAction<string>>;
};

export function AuthInput({
    label,
    ref,
    inputType,
    name,
    callBack,
}: AuthInputProps) {
    const errorTextContext = useContext(ErrorTextContext);
    const showErrorText = errorTextContext.showErrorText;
    
    useEffect(() => {
        if (ref) ref.current?.focus();
    }, []);

    return (
        <div className="auth-input" style={{ paddingBottom: "30px" }}>
            <div className="auth-input-label-container">
                <label>{label}</label>
                { showErrorText === true ? <label className="required-field-label">*</label> : null }
            </div>
            <br/>
            {inputType === "email" ? <input type={inputType} ref={ref} id={name} name={name} placeholder="you@example.com" onChange={e => callBack(e.target.value)}/> : null}
            {inputType === "password" ? <input type={inputType} ref={ref} id={name} name={name} placeholder="••••••••••••••••" onChange={e => callBack(e.target.value)}/> : null}
        </div>
    )
}

export function Option({text, value}: {text: string, value: string}) {
    return (
        <option value={value}>{text}</option>
    );
}