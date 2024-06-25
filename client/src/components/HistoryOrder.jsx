import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import '../style/historyOrder.css';

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
    const sortedOrderHistory = orderHistory.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    


    return (
      <div className="order-history">
        <h2>Order History</h2>
        <div className="order-list">
          {sortedOrderHistory.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            <ul>
              {sortedOrderHistory.map(order => (
                <li key={order.id} className="order-item">
                  <p>Order ID: {order.id}</p>
                  <p>Created At: {new Date(order.createdAt).toLocaleString()}</p>
                  <h3>Items:</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map(orderItem => (
                        <tr key={orderItem.id}>
                          <td>{orderItem.item.name}</td>
                          <td>{orderItem.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="order-details">
                    <p>Item Total Price: ${order.totalPrice}</p>
                    <h3>Delivery Information:</h3>
                    <p>Address: {order.address}</p>
                    <p>Postal Code: {order.postalCode}</p>
                    <p>Delivery Fee: ${order.deliveryFee}</p>
                    <h3>Total Price: ${parseFloat(order.totalPrice) + parseFloat(order.deliveryFee)}</h3>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
};