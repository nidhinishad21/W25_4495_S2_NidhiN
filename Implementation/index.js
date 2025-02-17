const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// GET route for root URL
app.get('/', (req, res) => {
  res.render('home.ejs');
});

// GET route for login page
app.get('/login', (req, res) => {
  res.render('login.ejs', {message: "Hi there"});
});

// POST route for handling login logic
app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  // Add your login logic here
  res.send(`Username: ${username}, Password: ${password}`);
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

