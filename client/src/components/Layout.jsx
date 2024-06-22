import { Outlet, Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function Layout() {
    const { isAuthenticated, loginWithRedirect } = useAuth0();

    const handleLogin = (e) => {
        e.preventDefault();
        loginWithRedirect();
      };

    return (
        <div>
            <h1>Cafe | Order Online</h1>
            <nav>
                <ul>
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/menu">Menu</Link>
                    </li>
                    <li>
                        <Link to="/about">About</Link>
                    </li>
                    <li>
                        {!isAuthenticated ? (              
                            <Link to="#" onClick={handleLogin} className="btn-primary">
                                Sign In / Sign Up
                            </Link>
                        ) : (
                            <Link to="/app">
                                My Account
                            </Link>
                        )}
                    </li>
                </ul>
            </nav>
        </div>

    );

}