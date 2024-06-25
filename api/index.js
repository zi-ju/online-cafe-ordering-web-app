import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import pkg from "@prisma/client";
import morgan from "morgan";
import cors from "cors";
import { auth } from "express-oauth2-jwt-bearer";

const { Decimal } = pkg;

// this is a middleware that will validate the access token sent by the client
const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  tokenSigningAlg: "RS256",
});

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// this is a public endpoint because it doesn't have the requireAuth middleware
app.get("/ping", (req, res) => {
  res.send("pong");
});

// requireAuth middleware will validate the access token sent by the client and will return the user information within req.auth
app.get("/orders", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  const orders = await prisma.order.findMany({
    where: {
      userId: parseInt(userId),
    },
    include: {
      items: {
        include: {
          item: true,
        },
      },
      user: true,
    },
  });
  res.status(200).json(orders);
});

// Create a new user
app.post('/users', async (req, res) => {
  try {
    // Extract user information from token
    const auth0Id = req.user.sub; 
    const { email, name } = req.body; 

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { auth0Id },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          auth0Id,
          email,
          name,
        },
      });
    }

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a user by auth0Id using query parameter
app.get('/users', async (req, res) => {
  const { auth0Id } = req.query;

  try {
    const user = await prisma.user.findUnique({
      where: {
        auth0Id: String(auth0Id),
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new orderItem
app.post('/order-items', async (req, res) => {
  const { orderId, itemId, quantity } = req.body;
  try {
    // fetch the item price
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });
    // create the orderItem
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId,
        itemId,
        quantity,
        price: item.price,
      },
    });
    res.status(201).json(orderItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create a new order
app.post('/orders', async (req, res) => {
  const { userId, address, postalCode, items, deliveryFee } = req.body;
  try {
    // Fetch items with their prices
    const itemDetails = await prisma.item.findMany({
      where: {
        id: {
          in: items.map(item => item.itemId),
        },
      },
    });
    // Create order items with prices
    const orderItemsData = items.map(item => {
      const itemDetail = itemDetails.find(detail => detail.id === item.itemId);
      return {
        itemId: item.itemId,
        quantity: item.quantity,
        price: itemDetail.price, 
      };
    });
    // Calculate the total price before creating the order
    const totalPrice = orderItemsData.reduce((total, item) => {
      return total.plus(new Decimal(item.price).times(item.quantity));
    }, new Decimal(0));
    // Add delivery fee to the total price
    totalPrice.plus(new Decimal(deliveryFee));

    // Create the order
    const order = await prisma.order.create({
      data: {
        userId,
        address,
        postalCode,
        items: {
          create: orderItemsData,
        },
        deliveryFee,
        totalPrice,
      },
      include: {
        items: true,
      },
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get an order according to order id
app.get('/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true,
        user: true,
        deliveryFee: true,
        totalPrice: true,
        address: true,
        postalCode: true,
      },
    });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
    } else {
      res.status(200).json(order);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders from a specific user by Auth0 ID
app.get('/users/orders', async (req, res) => {
  const { auth0Id } = req.query;
  try {
    // Find user based on auth0Id
    const user = await prisma.user.findUnique({
      where: {
        auth0Id,
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch orders for the found user
    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        user: true,
      },
    });
    if (orders.length === 0) {
      return;
    }
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
});


// Get the lastest order from a specific user by Auth0 ID
app.get('/users/latest-order', async (req, res) => {
  const { auth0Id } = req.query;
  try {
    // Find user based on auth0Id
    const user = await prisma.user.findUnique({
      where: {
        auth0Id,
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch orders for the found user
    const latestOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: { 
        createdAt: 'desc' 
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        user: true,
      },
    });
    if (!latestOrder) {
      // return res.status(404).json({ message: 'No orders found for this user' });
      return;
    }
    res.status(200).json(latestOrder);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new item
app.post('/items', async (req, res) => {
  const { name, description, image, price } = req.body;
  try {
    const item = await prisma.item.create({
      data: { name, description, image, price},
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all items
app.get('/items', async (req, res) => {
  try {
    const items = await prisma.item.findMany();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get best seller item
app.get('/best-seller', async (req, res) => {
  try {
    const bestSeller = await prisma.orderItem.groupBy({
      by: ['itemId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 1,
    });

    if (bestSeller.length > 0) {
      const bestSellerItem = await prisma.item.findUnique({
        where: { id: bestSeller[0].itemId },
      });
      return res.status(200).json(bestSellerItem);
    }

    return res.status(200).json({ message: 'Nothing trending this time.' });
  } catch (error) {
    console.error('Error finding best seller item:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// get Profile information of authenticated user
app.get("/me", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  res.json(user);
});

// this endpoint is used by the client to verify the user status and to make sure the user is registered in our database once they signup with Auth0
// if not registered in our database we will create it.
// if the user is already registered we will return the user information
app.post("/verify-user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const email = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/email`];
  const name = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/name`];

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  if (user) {
    res.json(user);
  } else {
    const newUser = await prisma.user.create({
      data: {
        email,
        auth0Id,
        name,
      },
    });

    res.json(newUser);
  }
});


// // Server acts as a proxy, forwarding the request to the Google Maps API
// // and returning the response to the client
// app.get('/calculate-distance', async (req, res) => {
//   const { origin, destination, apiKey } = req.query;
//   try {
//     const response = await fetch(
//       `https://maps.googleapis.com/maps/api/distancematrix/json
//       ?origins=${encodeURIComponent(origin)}
//       &destinations=${encodeURIComponent(destination)}
//       &key=${apiKey}`);
//     const data = await response.json();
//     res.json(data);
//   } catch (error) {
//     console.error('Error fetching distance:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

app.listen(8000, () => {
  console.log("Server running on http://localhost:8000 🎉 🚀");
});
