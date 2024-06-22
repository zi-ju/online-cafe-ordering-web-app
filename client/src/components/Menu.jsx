import Layout from "./Layout";
import React, { useState, useEffect } from 'react';
import { useAuthToken } from "../AuthTokenContext";
import { useAuth0 } from '@auth0/auth0-react';

const defaultItems = [
  { id: 1, name: 'Espresso', description: 'espresso description', image: 'espresso.jpg' },
  { id: 2, name: 'Latte', description: 'latte description', image: 'latte.jpg' },
  { id: 3, name: 'Cappuccino', description: 'cappuccino description', image: 'cappuccino.jpg' },
];

export default function Menu() {
  const [items, setItems] = useState(defaultItems);
  const [order, setOrder] = useState([]);
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const { accessToken } = useAuthToken();
  const { getAccessTokenSilently, user, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await fetch(`${process.env.REACT_APP_API_URL}/items`, {
          method: "GET",
        });
        const items = await data.json();
        setItems(items);
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    };

    fetchItems();
  }, []);

  const addToOrder = (item) => {
    const existingItem = order.find((orderItem) => orderItem.id === item.id);
    if (existingItem) {
      setOrder(
        order.map((orderItem) =>
          orderItem.id === item.id
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        )
      );
    } else {
      setOrder([...order, { ...item, quantity: 1 }]);
    }
  };

  const increaseQuantity = (item) => {
    setOrder(
      order.map((orderItem) =>
        orderItem.id === item.id
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      )
    );
  };

  const decreaseQuantity = (item) => {
    setOrder(
      order.map((orderItem) =>
        orderItem.id === item.id 
          ? { ...orderItem, quantity: orderItem.quantity - 1 }
          : orderItem
      ).filter((orderItem) => orderItem.quantity > 0)
    );
  };

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
  };

  const handlePostalCodeChange = (e) => {
    setPostalCode(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || isLoading || !user) {
      console.error('User not authenticated or user information not available.');
      return;
    }
    const token = accessToken || await getAccessTokenSilently();
    const auth0Id = user.sub;

    // get user id from auth0 id
    const userIdResponse = await fetch(`${process.env.REACT_APP_API_URL}/users?auth0Id=${auth0Id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const userIdData = await userIdResponse.json();
    const userId = userIdData.id;

    if (!userIdResponse.ok) {
      throw new Error(`Failed to fetch user ID: ${userIdResponse.status}`);
    }

    const data = await fetch(`${process.env.REACT_APP_API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        userId, 
        address,
        postalCode,
        items: order.map(item => ({
          itemId: item.id,
          quantity: item.quantity,
        })),
      }),
    });
    alert('Order placed successfully!');
    setOrder([]);
    setAddress('');
    setPostalCode('');
  };


    return (
      <div>
        <Layout />
        <h2>Menu</h2>
        <div className="menu">
          {items.map((item) => (
            <div key={item.id} className="menu-item">
              {/* <img src={item.image} alt={item.name} /> */}
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              {/* <a href={item.detailLink}>View Details</a> */}
              <button onClick={() => addToOrder(item)}>Add to Order</button>
            </div>
          ))}
        </div>

        <h2>My Order</h2>
        <ul>
          {order.map((item) => (
            <li key={item.id}>
              {item.name} - {item.quantity}
              <button onClick={() => increaseQuantity(item)}>+</button>
              <button onClick={() => decreaseQuantity(item)}>-</button>
            </li>
          ))}
        </ul>

        <h2>Delivery Information</h2>
        <form onSubmit={handleSubmit} className="address-form">
          <div>
            <label htmlFor="address">Address: </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={handleAddressChange}
              required
            />
          </div>
          <div>
            <label htmlFor="postalCode">Postal Code: </label>
            <input
              type="text"
              id="postalCode"
              value={postalCode}
              onChange={handlePostalCodeChange}
              required
            />
          </div>
          {isAuthenticated ? 
          <button type="submit">Place Order</button> 
          : 
          <p>Please log in to place an order</p> }
        </form>

      </div>
    )
  }
  