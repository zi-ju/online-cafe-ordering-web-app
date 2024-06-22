import "../style/appLayout.css";

import { Outlet, Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import Layout from "./Layout";

export default function MyAccount() {
  const { user, isLoading, logout } = useAuth0();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <Layout />
      <div>Welcome 👋 {user.name} </div>
      
      <div className="header">
        <nav className="menu">
          <ul className="menu-list">
            <li>
              <Link to="/app">Profile</Link>
            </li>
            <li>
              <Link to="/app/history-order">Order History</Link>
            </li>
            <li>
              <Link to="/app/debugger">Auth Debugger</Link>
            </li>
            <li>
              <button
                className="exit-button"
                onClick={() => logout({ returnTo: window.location.origin })}>
                Log Out
              </button>
            </li>
          </ul>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}