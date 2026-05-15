import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { User } from '../../lib/types/index';
import { UserContext } from '../../context';

function Dashboard() {
    const navigate = useNavigate();
    const user = useContext<User | null>(UserContext);

    useEffect(() => {
        if (!user) {
            alert("Not logged in");
            navigate("/");
        }
    }, [user, navigate]);

    if (!user) return null;

    return (
        <>
            <h1> This is the dashboard. </h1>
            <p>User ID: {user!.id}, email: {user!.email}</p>
        </>
    )
}

export default Dashboard