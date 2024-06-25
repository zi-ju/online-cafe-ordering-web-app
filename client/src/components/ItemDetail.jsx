import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from './Layout';
import '../style/itemDetail.css';

export default function ItemDetail() {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await fetch(`${process.env.REACT_APP_API_URL}/items/${itemId}`, {
          method: "GET",
        });
        const item = await data.json();
        setItem(item);
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    };
    fetchItems();
  }, []);

  if (!item) {
    return <p>Item not found</p>;
  }

  return (
    <div>
        <Layout />
        <div class="item-detail">
          <div class="item-detail-text">
            <h2>{item.name}</h2>
            <p class="item-description">{item.description}</p>
            <p class="item-price">${item.price}</p>
          </div>
          <div class="item-detail-image">
            <img src={`${process.env.PUBLIC_URL}/${item.image}`} alt={item.name} />
          </div>
        </div>
    </div>
  );
};