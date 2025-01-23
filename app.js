const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(bodyParser.json());
const bcrypt = require('bcryptjs');

// Register a new user
app.post('/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName
      },
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ error: "Error registering user", details: error.message });
  }
});

// Login the user (no token now)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    res.json({ message: "Login successful" }); // No token is sent
  } catch (error) {
    res.status(500).json({ error: "Error logging in", details: error.message });
  }
});

// CRUD for Categories
app.post('/categories', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  try {
    const category = await prisma.category.create({ data: { name } });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { foodItems: true },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRUD for Food Items
app.post('/foodItems', async (req, res) => {
  const { name, price, categoryId } = req.body;
  try {
    const foodItem = await prisma.foodItem.create({
      data: {
        name,
        price,
        category: { connect: { id: categoryId } },
      },
    });
    res.status(201).json(foodItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/foodItems', async (req, res) => {
  try {
    const foodItems = await prisma.foodItem.findMany({
      include: { category: true },
    });
    res.json(foodItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Categories or Food Items
app.delete('/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.category.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Category not found or has associated food items." });
  }
});

app.delete('/foodItems/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.foodItem.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Food item not found." });
  }
});

// Add a new order (No authentication needed now)
app.post('/orders', async (req, res) => {
  const { foodItems, notes, discountCoupon } = req.body;

  if (!foodItems || foodItems.length === 0) {
    return res.status(400).json({ error: "Food items are required" });
  }

  try {
    const order = await prisma.order.create({
      data: {
        quantity: foodItems.reduce((acc, item) => acc + item.quantity, 0),
        notes,
        discountCoupon,
        foodItem: {
          connect: foodItems.map(item => ({ id: item.foodId })),
        },
      },
      include: {
        foodItem: true,
      },
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get Orders
app.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        foodItem: true,
      },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
