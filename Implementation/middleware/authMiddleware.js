const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    try {
        const token = req.cookies['u-xarh'];

        if (!token) return res.render('common/error.ejs', { message: 'You got it wrong.' });

        const decoded = jwt.verify(token, 'your-secret-key');
        req.username = decoded.userId;
        req.firstname = decoded.firstname;
        next();
    } catch (error) {
        console.log(error);
        // The user is not logged in. So redirect them to login page.
        res.render("visitor/login.ejs");
    }
 };

module.exports = verifyToken;