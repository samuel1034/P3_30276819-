const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.loginPage = (req, res) => {
 res.render('login');
};

exports.loginUser = async (req, res) => {
 const { username, password } = req.body;
 const user = { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD };

 if (username && password) {
    try {
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (isPasswordMatch) {
        const token = jwt.sign({ username: user.username }, process.env.SECRET_KEY);
        res.cookie('jwt', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.status(200).redirect('/dashboard');
      } else {
        res.status(400).json({ message: 'Password incorrect' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
 } else {
    res.status(400).json({ message: 'Please enter username and password' });
 }
};