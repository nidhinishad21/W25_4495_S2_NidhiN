// routes/auth.js
 const express = require('express');
 const router = express.Router();
 const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, async(req, res) => {
    let firstname = req.firstname;
    res.render("dashboard/home.ejs" , { firstname: firstname});
 });


 module.exports = router;