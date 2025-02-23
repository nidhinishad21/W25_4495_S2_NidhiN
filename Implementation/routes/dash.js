// routes/auth.js
 const express = require('express');
 const router = express.Router();
 const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, async(req, res) => {
    let firstname = req.firstname;
    res.render("dashboard/home.ejs" , { path: '/dashboard', firstname: firstname});
 });

 router.get('/insights', verifyToken, (req, res) => {
    res.render('dashboard/home.ejs', {
        path: '/dashboard/insights',
        firstname: req.firstname
    });
});
router.get('/transactions', verifyToken, (req, res) => {
    res.render('dashboard/home.ejs', {
        path: '/dashboard/transactions',
        firstname: req.firstname
    });
});
router.get('/categories', verifyToken, (req, res) => {
    res.render('dashboard/home.ejs', {
        path: '/dashboard/categories',
        firstname: req.firstname
    });
});


 module.exports = router;