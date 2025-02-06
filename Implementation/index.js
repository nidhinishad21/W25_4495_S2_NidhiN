// Import the express module
const express = require('express');

// Create an express application
const app = express();

// Define the port number
const port = 3000;

// Create a GET endpoint at '/hello'
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
