import "../style/home.css";
import Layout from "./Layout";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function Home() {
  const [bestSeller, setBestSeller] = useState(null);
  const [bestSellerMessage, setBestSellerMessage] = useState('');
  const [latestOrder, setLatestOrder] = useState([]);
  const { user, isAuthenticated } = useAuth0();


  useEffect(() => {
    const fetchBestSeller = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/best-seller`, {
          method: "GET",
          headers: {
              "Content-Type": "application/json",
          },
          });
          const bestSeller = await response.json();
          if (bestSeller.message) {
            setBestSeller(null);
            setBestSellerMessage(bestSeller.message);
          } else {
            setBestSeller(bestSeller);
            setBestSellerMessage('');
          }
      } catch (error) {
        console.error('Error fetching best seller:', error);
      }
    };
    fetchBestSeller();
  }, []);

  useEffect(() => {
    const fetchLatestOrder = async () => {
      if (!isAuthenticated) {
        return;
      }
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/users/latest-order?auth0Id=${encodeURIComponent(user.sub)}`, {
          method: "GET",
          headers: {
              "Content-Type": "application/json",
          },
          });
          const latestOrder = await response.json();
          console.log('latestOrder:', latestOrder);
          setLatestOrder(latestOrder);
      } catch (error) {
        console.error('Error fetching latest order:', error);
      }
    };
    fetchLatestOrder();
  }, []);


  return (
    <div className="home">
      <Layout />
      <div>
      <img src={`${process.env.PUBLIC_URL}/Cafe.jpg`} alt="cafe" />
      </div>
      <div>
        <h2>Trending🔥</h2>
        {bestSeller ? (
          <div>
            <h3>{bestSeller.name}</h3>
            <p>{bestSeller.description}</p>
          </div>
        ) : (
          <p>{bestSellerMessage}</p>
        )}
      </div>
      {isAuthenticated ? (
        <div>
          <h2>Glad to see you again, {user.name} 👋 </h2>
          {(latestOrder !== null && typeof latestOrder === 'object' && !Array.isArray(latestOrder)) ? (
            <p>Last time you ordered: {latestOrder.items.map(orderItem => orderItem.item.name).join(', ')}</p>
          ) : (
            <p>You haven't placed any order yet.</p>
          )}
        </div>
      ): (
        <div>
          <h2>Welcome to our coffee shop ☕️</h2>
          <p>Sign in to see your latest order</p>
        </div>
      )}
    </div>
    );
}
