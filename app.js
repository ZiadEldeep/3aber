const express = require("express");
const bodyParser = require("body-parser");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(bodyParser.json());

// === Category APIs ===

// Create a category
app.post("/categories", async (req, res) => {
  const { name, parentId } = req.body;

  try {
    const category = await prisma.category.create({
      data: {
        name,
        parentId,
      },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all categories (including subcategories)
app.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subcategories: true,
      },
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a category by ID
app.get("/categories/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        parent: true,
        subcategories: true,
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === Food Item APIs ===

// Create a food item
app.post("/food-items", async (req, res) => {
  const { name, price, categoryId } = req.body;

  try {
    const foodItem = await prisma.foodItem.create({
      data: {
        name,
        price,
        categoryId,
      },
    });
    res.status(201).json(foodItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all food items
app.get("/food-items", async (req, res) => {
  try {
    const foodItems = await prisma.foodItem.findMany({
      include: {
        category: true,
      },
    });
    res.status(200).json(foodItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === Order APIs ===

// Create an order
app.post("/orders", async (req, res) => {
  const { quantity, notes, discountCoupon, foodItemId, userId } = req.body;

  try {
    const order = await prisma.order.create({
      data: {
        quantity,
        notes,
        discountCoupon,
        foodItemId,
        userId,
      },
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders
app.get("/orders", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        foodItem: true,
        user: true,
      },
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === User APIs ===

// Register a user
app.post("/register", async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password,
        firstName,
        lastName,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login with email and password
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === Start Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
