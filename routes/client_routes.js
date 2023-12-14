const express = require('express');
const router = express.Router();
const db = require('../models/db');
const axios = require('axios');

router.get('/', function (req, res) {
    let nombre = req.query.nombre;
    let precio = req.query.precio;
    let image = req.query.image;

    db.all('SELECT * FROM productos', [], (err, rows) => {
        if (err) {
            console.log(err);
            res.send("Error occurred while fetching products");
        } else {
            let filteredProducts = rows.filter(function(product) {
                return (!nombre || product.nombre.includes(nombre)) &&
                       (!precio || product.precio >= precio) &&
                       (!image || product.image.includes(image));
            });
            
            res.render('client', { products: filteredProducts });
        }
    });
});

router.get('/product_detail/:codigo', function(req, res){
    const codigo = req.params.codigo;    

    db.get('SELECT * FROM productos WHERE codigo = ?', [codigo], (err, product) => {
        if (err) {
            console.log('Error:', err.message); // Log the error message
            res.send("Error occurred while fetching product");
        } else {
            if (product) {                
                res.render('product_detail', { product: product });
            } else {
                console.log('No product found with the provided codigo');
                res.send('No product found with the provided codigo');
            }
        }
    });
});

router.get('/about_client', function(req, res){
    res.render('about_client');
});

router.get('/detail_client', function(req, res){
    res.render('detail_client');
});

router.get('/service_client', function(req, res){
    res.render('service_client');
});

router.get('/signup', (req, res) => {    
    res.render('sing_up_user');
});

router.post('/signup', async (req, res) => {
  const nombre = req.body.nombre;
  const correo = req.body.correo;
  const contraseña = req.body.contraseña;
  

  try {
      // Check if the user already exists
      const userQuery = `SELECT EXISTS(SELECT 1 FROM clientes WHERE email = ? AND contraseña =  ?) AS userExists`;
    db.get(userQuery, [correo, contraseña], function(error, row) {
      try {
        if (error) {
          console.error('Error al consultar los datos:', error.message);
          return res.status(500).send('Error interno del servidor');
        }

        const userExists = row.userExists === 1;

        // User already exists, prompt a message and redirect
        if (userExists) {
          return res.send('<script>alert("El usuario ingresado ya existe"); window.location.href = "/signup";</script>');
        }
              
              // User does not exist, proceed with registration
              const insertQuery = `INSERT INTO clientes (nombre, email, contraseña) VALUES (?, ?, ?)`;
              db.run(insertQuery, [nombre, correo, contraseña], function(error) {
                  try {
                      if (error) {
                          console.error('Error al guardar los datos:', error.message);
                          return res.status(500).send('Error interno del servidor');
                      }

                      console.log(`Datos guardados correctamente. ID de cliente: ${this.lastID}`);
                      res.redirect('/success');
                  } catch (error) {
                      // Handle the error here
                      console.error('Error:', error.message);
                      return res.status(500).send('Error interno del servidor');
                  }
              });
          } catch (error) {
              // Handle the error here
              console.error('Error:', error.message);
              return res.status(500).send('Error interno del servidor');
          }
      });
  } catch (error) {
      // Handle the error here
      console.error('Error:', error.message);
      return res.status(500).send('Error interno del servidor');
  }
});

router.get('/signin', (req, res) => {
    res.render('sing_in_user');
})

router.post('/signin', (req, res) => {
  const email = req.body.email; // Get the email from the form submission
  const password = req.body.password; // Get the password from the form submission

  const query = `SELECT * FROM clientes WHERE email = ? AND contraseña = ?`;
  db.get(query, [email, password], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
      return;
    }

    if (row) {
      // If email and password match, redirect to /success_login
      res.redirect('/success_login');
    } else {
      // If email and password do not match, display an error message
      return res.send('<script>alert("Error en el correo o la contraseña"); window.location.href = "/signin";</script>');
    }
  });
});

router.get('/success', function(req, res) {
    res.render('success_page');
});

router.get('/success_login', function(req, res) {
  res.render('success_login');
});

module.exports = router;