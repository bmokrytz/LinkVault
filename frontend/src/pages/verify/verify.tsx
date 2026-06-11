import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { verify } from "../../lib/api/auth";
import './verify.css';

function Verify() {
    const [success, setSuccess] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [error, setError] = useState<boolean>(false);
    const pendingMessage = "Verifying your account. This may take a moment...";
    const successMessage = "Thank you for verifying your account. You may sign into LinkVault now.";
    const navigate = useNavigate();
    const { verification_token } = useParams();

    useEffect(() => {
        handleVerify();
    }, []);

    async function handleVerify(): Promise<void> {
        if (verification_token) {
            const error = await verify(verification_token);
            if (error) {
                setErrorMessage(error);
                setError(true);
                return;
            }
            setSuccess(true);
            return;
        }
        setErrorMessage("The verification token is missing or invalid. Sign in again to request a new verification email.");
        setError(true);
    }

    function loginButtonHandler(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        if (e.button === 2) return;
        navigate("../login");
    }

    return (
        <div className="verify-outer-container">
            <div className="verify-inner-container">
                <span>{error
                            ? errorMessage
                            : success
                                ? successMessage
                                : pendingMessage}</span>
                <button className="login-btn-landing" onMouseDown={(e) => {loginButtonHandler(e);}}>Sign in</button>
            </div>
        </div>
    );
}

export default Verify;
