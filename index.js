const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const port = process.env.PORT || 4000;

// MIDDLEWARE
app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

// ----------------------
// MONGODB CONNECT
// ----------------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("MongoDB Error:", err));

// ----------------------
// STATIC IMAGES (LOCAL ONLY)
// ----------------------
app.use("/images", express.static("upload/images"));

// ----------------------
// MULTER STORAGE (LOCAL ONLY)
// ----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "upload/images");
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// Upload Route
app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    success: true,
    image_url: `/images/${req.file.filename}`,
  });
});

// ----------------------
// USER SCHEMA
// ----------------------
const Users = mongoose.model("Users", {
  name: String,
  email: { type: String, unique: true },
  password: String,
  cartData: Object,
  date: { type: Date, default: Date.now },
});

// ----------------------
// PRODUCT SCHEMA
// ----------------------
const Product = mongoose.model("Product", {
  id: Number,
  name: String,
  description: String,
  image: String,
  category: String,
  new_price: Number,
  old_price: Number,
  date: { type: Date, default: Date.now },
  avilable: Boolean,
});

// ----------------------
// TEST ROUTE
// ----------------------
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// ----------------------
// SIGNUP
// ----------------------
app.post("/signup", async (req, res) => {
  let success = false;
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({ success: false, error: "User already exists" });
  }

  let cart = {};
  for (let i = 0; i < 300; i++) cart[i] = 0;

  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });

  await user.save();

  const data = { user: { id: user.id } };
  const token = jwt.sign(data, "secret_ecom");

  res.json({ success: true, token });
});

// ----------------------
// LOGIN
// ----------------------
app.post("/login", async (req, res) => {
  let user = await Users.findOne({ email: req.body.email });
  if (!user || user.password !== req.body.password) {
    return res.status(400).json({ success: false, error: "Invalid credentials" });
  }

  const data = { user: { id: user.id } };
  const token = jwt.sign(data, "secret_ecom");

  res.json({ success: true, token });
});

// ----------------------
// FETCH USER MIDDLEWARE
// ----------------------
const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const data = jwt.verify(token, "secret_ecom");
    req.user = data.user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ----------------------
// GET ALL PRODUCTS (FIXED)
// ----------------------
app.get("/allproducts", async (req, res) => {
  try {
    let { page, limit, sort, order, category, search } = req.query;

    let query = {};
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: "i" };

    let sortOptions = {};
    if (sort) sortOptions[sort] = order === "desc" ? -1 : 1;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;  // fixed for Render
    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

// ----------------------
// NEW COLLECTIONS
// ----------------------
app.get("/newcollections", async (req, res) => {
  let products = await Product.find({});
  let arr = products.slice(-8);
  res.send(arr);
});

// ----------------------
// POPULAR WOMEN PRODUCTS
// ----------------------
app.get("/popularinwomen", async (req, res) => {
  let products = await Product.find({ category: "women" });
  res.send(products.slice(0, 4));
});

// ----------------------
// RELATED PRODUCTS
// ----------------------
app.post("/relatedproducts", async (req, res) => {
  let products = await Product.find({ category: req.body.category });
  res.send(products.slice(0, 4));
});

// ----------------------
// ADD TO CART
// ----------------------
app.post("/addtocart", fetchuser, async (req, res) => {
  let userData = await Users.findById(req.user.id);
  userData.cartData[req.body.itemId] += 1;
  await userData.save();
  res.send("Added");
});

// ----------------------
// REMOVE FROM CART
// ----------------------
app.post("/removefromcart", fetchuser, async (req, res) => {
  let userData = await Users.findById(req.user.id);
  if (userData.cartData[req.body.itemId] > 0)
    userData.cartData[req.body.itemId] -= 1;

  await userData.save();
  res.send("Removed");
});

// ----------------------
// GET CART
// ----------------------
app.post("/getcart", fetchuser, async (req, res) => {
  let userData = await Users.findById(req.user.id);
  res.json(userData.cartData);
});

// ----------------------
// ADD PRODUCT (ADMIN)
// ----------------------
app.post("/addproduct", async (req, res) => {
  let products = await Product.find({});
  let id = products.length > 0 ? products[products.length - 1].id + 1 : 1;

  const product = new Product({
    id,
    name: req.body.name,
    description: req.body.description,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });

  await product.save();
  res.json({ success: true });
});

// ----------------------
// REMOVE PRODUCT (ADMIN)
// ----------------------
app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  res.json({ success: true });
});

// ----------------------
// UPDATE PRODUCT
// ----------------------
app.put("/updateproduct", async (req, res) => {
  const updated = await Product.findOneAndUpdate(
    { id: req.body.id },
    req.body,
    { new: true }
  );
  res.json({ success: true, product: updated });
});

// ----------------------
// START SERVER
// ----------------------
app.listen(port, () => {
  console.log("Server running on port", port);
});
