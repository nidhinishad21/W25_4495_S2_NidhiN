const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const db = require('./utils/db');
const app = express();

app.use(express.json());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.render('home');
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});