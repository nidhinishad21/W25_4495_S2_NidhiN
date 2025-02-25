// routes/auth.js
 const express = require('express');
 const router = express.Router();
 const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, async(req, res) => {
    let firstname = req.firstname;
    const p_data = {
        labels: ['Electronics', 'Clothing', 'Food', 'Books', 'Others'],
        values: [45000, 35000, 28000, 15000, 12000]
    };

    res.render("dashboard/home.ejs" , { path: '/dashboard', firstname: firstname, c_data: p_data});
 });

 router.get('/insights', verifyToken, (req, res) => {
    res.render('dashboard/insights.ejs', {
        path: '/dashboard/insights',
        firstname: req.firstname
    });
});
router.get('/transactions', verifyToken, (req, res) => {
    res.render('dashboard/transactions.ejs', {
        path: '/dashboard/transactions',
        firstname: req.firstname
    });
});
router.get('/categories', verifyToken, (req, res) => {
    res.render('dashboard/categories.ejs', {
        path: '/dashboard/categories',
        firstname: req.firstname
    });
});


 module.exports = router;