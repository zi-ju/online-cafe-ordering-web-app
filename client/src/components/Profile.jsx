import { useAuth0 } from "@auth0/auth0-react";
import { useAuthToken } from "../AuthTokenContext";
import { useEffect, useState } from "react";

export default function Profile() {
  const { user } = useAuth0();
  const { accessToken } = useAuthToken();
  const [nickname, setNickname] = useState("");
  const [newNickname, setNewNickname] = useState("");

  useEffect(() => {
      const fetchNickname = async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/users?auth0Id=${(user.sub)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            });
          const data = await response.json();
          setNickname(data.nickname);
        } catch (error) {
          console.error("Error fetching nickname: ", error);
        }
      };
      fetchNickname();
  }, [user]);

  const handleNicknameChange = (event) => {
    setNewNickname(event.target.value);
  };

  const handleNicknameSubmit = async (event) => {
    event.preventDefault();
    if (!newNickname) {
      alert("New nickname is required");
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${user.sub}/nickname`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ nickname: newNickname }),
      });
      if (!response.ok) {
        throw new Error("Error updating nickname");
      }
      const data = await response.json();
      setNickname(data.nickname);
      setNewNickname("");
    } catch (error) {
      console.error("Error updating nickname:", error);
    }
  };

  return (
    <div>
      <div>
        <p>Name: {user.name}</p>
      </div>

      <div>
        <p>Nickname: {nickname} </p>
        <form onSubmit={handleNicknameSubmit}>
          <div>
            <input
                type="text"
                value={newNickname}
                onChange={handleNicknameChange}
                placeholder="New Nickname"
                className="nickname-input"
              />
          </div>
          <div>
            <button type="submit">
              Update Nickname
            </button>
          </div>
        </form>
      </div>

      <div>
        <p>📧 Email: {user.email}</p>
      </div>
      <div>
        <p>🔑 Auth0Id: {user.sub}</p>
      </div>
      <div>
        <p>✅ Email verified: {user.email_verified?.toString()}</p>
      </div>
    </div>
  );
}