import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export default function HistoryOrder() {
    const { user } = useAuth0();
    const [orderHistory, setOrderHistory] = useState([]);

    useEffect(() => {
        const fetchOrderHistory = async () => {
            try {
                const data = await fetch(`${process.env.REACT_APP_API_URL}/users/orders?auth0Id=${encodeURIComponent(user.sub)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                });
                const orders = await data.json();
                setOrderHistory(orders);
            } catch (error) {
                console.error('Error fetching order history:', error);
            }
        }
        fetchOrderHistory();
    }, []);

    // Sort orders by createdAt in descending order
    const sortedOrderHistory = orderHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));


    return (
      <div>
        <h2>Order History</h2>
        {sortedOrderHistory.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <ul>
            {sortedOrderHistory.map(order => (
              <div key={order.id}>
                <p>Order ID: {order.id}</p>
                <p>Created At: {new Date(order.createdAt).toLocaleString()}</p>
                <h3>Items:</h3>
                <ul>
                  {order.items.map(orderItem => (
                    <li key={orderItem.id}>
                      <p>{orderItem.item.name} - Quantity: {orderItem.quantity}</p>
                    </li>
                  ))}
                </ul>
                <p>Address: {order.address}</p>
                <p>Postal Code: {order.postalCode}</p>
              </div>
            ))}
          </ul>
        )}
      </div>
    );
};