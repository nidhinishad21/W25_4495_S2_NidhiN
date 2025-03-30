require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const dashRoutes = require("./routes/dash");
const db = require("./utils/db"); // Make sure this is before your routes

const app = express();
app.use(cookieParser());
app.use(express.json());
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/dashboard", dashRoutes);

app.get("/", (req, res) => {
  const token = req.cookies["u-xarh"];
  if (token) {
    res.redirect("/dashboard");
  }
  res.render("visitor/home.ejs");
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
