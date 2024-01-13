const express = require('express');
const router = express.Router();
const db = require('../models/db');
const axios = require('axios');
const requestIp = require('request-ip');
const crypto = require('crypto');

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

router.get('/checkout', function(req, res) {
    res.render('checkout');
});


let producto_id = 'default';

router.get('/payments', function(req, res) {
  // Get total price and productCount from query parameters
  let totalPrice = req.query.totalPrice;
  let productCount = req.query.productCount;

  db.all('SELECT codigo FROM productos', [], (err, rows) => {
    if (err) {
      throw err;
    }

    // Log all codigo values
    rows.forEach((row, index) => {
      console.log(row.codigo);
      if (index === 0) {
        producto_id = row.codigo;
      }
    });

    // Render template with total price, productCount, and products
    res.render('payment', { totalPrice: totalPrice, productCount: productCount, productos: rows });
  });
});

router.get('/purchases', (req, res) => {
  db.all('SELECT * FROM compras', [], (err, rows) => {
    if (err) {
      throw err;
    }
    res.render('allPurchases', { purchases: rows });
  });
});

router.post('/payments', function(req, res) {
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSm9obiBEb2UiLCJkYXRlIjoiMjAyNC0wMS0wM1QyMDoyODozOS4xMzJaIiwiaWF0IjoxNzA0MzEzNzE5fQ.pYfdwFMfOCAzZGQj9U8xW_mWiUy1NnjJ9cYlY2U9W6c';
    const apiUrl = 'https://fakepayment.onrender.com/payments';
    const nombre = req.body.nombre;    
    const correo = req.body.correo;
    const contraseña = req.body.contraseña;
    
  
    // Check if the user exists
    const userQuery = `SELECT * FROM clientes WHERE nombre = ?`;
    db.get(userQuery, [nombre], function(error, row) {
      if (error) {
        console.error('Error checking user:', error);
        return res.status(500).send('<script>alert("Internal Server Error"); window.location.href = "/signin";</script>');
      }
  
      if (!row) {
        return res.send('<script>alert("Please sign in to make a purchase"); window.location.href = "/signin";</script>');
      }

      
      
      const validateCreditCard = async (paymentData) => {
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(paymentData)
          });
    
          const result = await response.json();
          return result;
        } catch (error) {
          console.error('Error validating credit card:', error);
          throw error;
        }
      };
    
      const nombre = req.body.nombre;
      const cardNumber = req.body.cardnumber;
      const expirationMonth = req.body['expiry-month'];
      const expirationYear = req.body['expiry-year'];
      const cvv = req.body.cvv;
    
      const paymentData = {
        amount: 99.99,
        'card-number': cardNumber,
        cvv: cvv,
        'expiration-month': expirationMonth,
        'expiration-year': expirationYear,
        'full-name': nombre,
        currency: 'USD',
        description: 'Payment for product',
        reference: '123456789'
      };
      db.all('SELECT codigo FROM productos', [], (err, rows) => {
        if (err) {
          throw err;
        }
      
        let producto_id;
        rows.forEach((row, index) => {
          // Use the first codigo as producto_id
          if (index === 0) {
            producto_id = row.codigo;
          }
        });
      
        // Only validate the credit card once, after getting the first producto_id
        validateCreditCard(paymentData)
          .then((result) => {
            if (result.errors && result.errors.length > 0) {
              const errorMsg = result.errors.map(error => `${error.path}: ${error.msg}`).join(', ');
              return res.send('<script>alert("Error: ' + errorMsg + '"); window.location.href = "/signin";</script>');
            } else {
              // Save payment details
              const paymentDetails = {
                cliente_id: crypto.randomBytes(16).toString('hex'), 
                producto_id: producto_id, 
                cantidad: req.body.productCount, 
                total_pagado: req.body.totalPrice,
                fecha: new Date().toISOString().split('T')[0],
                ip_cliente: req.ip
              };
      
              // Log paymentDetails to the console
              console.log(paymentDetails);
      
              // Save paymentDetails to the database
              const insertQuery = `INSERT INTO compras (cliente_id, producto_id, cantidad, total_pagado, fecha, ip_cliente) VALUES (?, ?, ?, ?, ?, ?)`;
              db.run(insertQuery, [paymentDetails.cliente_id, paymentDetails.producto_id, paymentDetails.cantidad, paymentDetails.total_pagado, paymentDetails.fecha, paymentDetails.ip_cliente], function(error) {
                if (error) {
                  console.error('Error saving payment details:', error);
                  return res.status(500).send('<script>alert("Internal Server Error"); window.location.href = "/signin";</script>');
                }
      
                // Render the 'payment' view with the total price
                return res.send('<script>alert("Gracias por su compra"); window.location.href = "/";</script>');
              });
            }
          })
          .catch((error) => {
            console.error('Error validating credit card:', error);
            return res.status(500).send('<script>alert("Internal Server Error"); window.location.href = "/signin";</script>');
          });
      });      
    });
    
    

router.get('/shoppingCart', function(req, res) {
  db.all('SELECT * FROM productos', [], (err, rows) => {
    if (err) {
      throw err;
    }
    res.render('shopping-cart', { products: rows });
  });
});
})

module.exports = router;

