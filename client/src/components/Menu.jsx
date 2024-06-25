import Layout from "./Layout";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthToken } from "../AuthTokenContext";
import { useAuth0 } from '@auth0/auth0-react';

const defaultItems = [
  { id: 1, name: 'Espresso', description: 'A good Espresso', image: 'espresso.jpg', price: 2.5},
  { id: 2, name: 'Latte', description: 'A good Latte', image: 'latte.jpg', price: 3.5},
  { id: 3, name: 'Cappuccino', description: 'A good Cappuccino', image: 'cappuccino.jpg', price: 4.0},
];

const STORE_ADDRESS = "410 W Georgia St, Vancouver, BC V6B 1Z3, Canada";
const STORE_ADDRESS_LAT = 49.2806361;
const STORE_ADDRESS_LNG = -123.1159038;

export default function Menu() {
  const [items, setItems] = useState(defaultItems);
  const [order, setOrder] = useState([]);
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const { accessToken } = useAuthToken();
  const navigate = useNavigate();
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

  const handleViewDetails = (itemId) => {
    navigate(`/item/${itemId}`);
  };

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

  const handleCalculateDeliveryFee = async () => {
    try {
      setDeliveryFee(null);
      setServiceAvailable(true);

      // get lat and lng of the delivery address from postal code
      const addressUrl = 'https://map-geocoding.p.rapidapi.com/json?address=' + encodeURIComponent(postalCode);
      const addressOptions = {
        method: 'GET',
        headers: {
          'x-rapidapi-key': '58cad3c0ccmsh837c4462d52b4bdp10141djsn061b068caf24',
          'x-rapidapi-host': 'map-geocoding.p.rapidapi.com'
        }
      };
      const addressResponse = await fetch(addressUrl, addressOptions);
      const addressData = await addressResponse.json();
      const destinationLatitude = addressData.results[0].geometry.location.lat;
      const destinationLongitude = addressData.results[0].geometry.location.lng;
      
      const distanceUrl = `https://trueway-matrix.p.rapidapi.com/CalculateDrivingMatrix?origins=${STORE_ADDRESS_LAT}%2C${STORE_ADDRESS_LNG}&destinations=${destinationLatitude}%2C${destinationLongitude}`;
      const distanceOptions = {
        method: 'GET',
        headers: {
          'x-rapidapi-key': '58cad3c0ccmsh837c4462d52b4bdp10141djsn061b068caf24',
          'x-rapidapi-host': 'trueway-matrix.p.rapidapi.com'
        }
      };
      const distanceResponse = await fetch(distanceUrl, distanceOptions);
      const distanceResult = await distanceResponse.json();
      const distanceInKm = distanceResult.distances[0][0] / 1000;

      // calculate delivery fee based on distance
      let deliveryFee = 0;
      if (distanceInKm < 5.00) {
        deliveryFee = 1.0;
      } else if (distanceInKm < 13.00) {
        deliveryFee = 1.5;
      } else if (distanceInKm < 20.00) {
        deliveryFee = 2.0;
      } else {
        setServiceAvailable(false);
        setDeliveryFee(null);
        return;
      }
      setServiceAvailable(true);
      setDeliveryFee(deliveryFee.toFixed(1));

    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      setDeliveryFee(null); 
    }
  };

  const calculateTotalFee = (order) => {
    return order.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const calculateTotalWithDeliveryFee = (order, deliveryFee) => {
    const previousTotal = order.reduce((acc, item) => acc + item.price * item.quantity, 0);
    return previousTotal + parseFloat(deliveryFee);
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
        deliveryFee,
      }),
    });
    alert('Order placed successfully!');
    setOrder([]);
    setAddress('');
    setPostalCode('');
    setDeliveryFee(null);
  };

    return (
      <div>
        <Layout />
        <h2>Menu</h2>
        <div className="menu">
          {items.map((item) => (
            <div key={item.id} className="menu-item">
              <h2>{item.name}</h2>
              <img src={`${process.env.PUBLIC_URL}/${item.image}`} alt={item.name} />
              <p>{item.description}</p>
              <p>${item.price}</p>
              <button onClick={() => handleViewDetails(item.id)}>View Details</button>
              <button onClick={() => addToOrder(item)}>Add to Order</button>
            </div>
          ))}
        </div>

        <h2>My Order</h2>
        <ul>
          {order.map((item) => (
            <li key={item.id}>
              {item.name} - {item.quantity} = ${item.price * item.quantity}
              <button onClick={() => increaseQuantity(item)}>+</button>
              <button onClick={() => decreaseQuantity(item)}>-</button>
            </li>
          ))}
        </ul>
        <p>Item Total Price: ${calculateTotalFee(order)}</p>

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
          <button type="button" onClick={handleCalculateDeliveryFee}>
            Calculate Delivery Fee
          </button>
          {deliveryFee !== null ? (
            <div>
              <p>Delivery Fee: ${deliveryFee}</p>
              <p>Total Price With Delivery Fee: ${calculateTotalWithDeliveryFee(order, deliveryFee)}</p>
              {isAuthenticated ? 
          <button type="submit">Place Order</button> 
          : 
          <p>Please log in to place an order</p> }
            </div>
          ) : !serviceAvailable ? (
            <p>Delivery service not available for this distance.</p>
          ) : null}
          {/* {isAuthenticated ? 
          <button type="submit">Place Order</button> 
          : 
          <p>Please log in to place an order</p> } */}
        </form>

      </div>
    )
  }
  