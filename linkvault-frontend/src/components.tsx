import { useNavigate } from 'react-router';

export function BackButton() {
    const navigate = useNavigate();
    return (
        <div className="back-btn-box">
            <button className="back-btn" onClick={() => { navigate("/") }}>← Back</button>
        </div>
    );
}

