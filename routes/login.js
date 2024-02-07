const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
dotenv.config({ path:'./credentials.env'});
const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;

router.route('/')
  .get(function(req, res) {
    res.render('login');
  })
  .post(async function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    

    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        res.render('home');
     } else {
        res.render("error");
     }
  });

module.exports = router;