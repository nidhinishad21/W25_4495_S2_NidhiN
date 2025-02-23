// routes/auth.js
 const express = require('express');
 const router = express.Router();
 const User = require('../models/User');
 const bcrypt = require('bcrypt');
 const jwt = require('jsonwebtoken');

// Get pages
router.get('/register', (req, res) => {
    const token = req.cookies['u-xarh'];
    if (token) {
        res.redirect("/dashboard");
    }
    res.render('visitor/register.ejs');
  })
  
router.get('/login', (req, res) => {
    const token = req.cookies['u-xarh'];
    if (token) {
        res.redirect("/dashboard");
    }
    res.render('visitor/login.ejs');
})


// User registration
router.post('/register', async (req, res) => {
    try {
        const { username, password, firstname, lastname, email } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User(
            { 
                username, 
                password: hashedPassword,
                firstname,
                lastname,
                email
            });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.log(error);
        res.render("common/error.ejs", { message: 'Registration failed' });
    }
 });

// User login
 router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            console.log("user not found");
            return res.status(401).json({ error: 'Authentication failed' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            const token = jwt.sign({ userId: user.username, firstname: user.firstname }, 'your-secret-key', {
                expiresIn: '24h',
                });
        
            res.cookie('u-xarh', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',  // Changed to 'lax' to allow redirect
                maxAge: 24 * 60 * 60 * 1000,
                path: '/'  // Ensure cookie is available across all paths
            });
    
            res.redirect("/dashboard");
            
        } else {
            return res.status(401).json({ error: 'Authentication failed' });
        }
    } catch (error) {
        console.log(error);
        res.render("common/error.ejs", { message: 'Login failed' });
    }
 });


 router.post('/logout', (req, res) => {
    try {
        // Clear the authentication cookie
        res.clearCookie('u-xarh', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'  // Make sure path matches the one used when setting the cookie
        });
        
        // Redirect to login page
        res.redirect('/');
    } catch (error) {
        console.log(error);
        res.render("common/error.ejs", { message: 'Logout failed' });
    }
});

module.exports = router;