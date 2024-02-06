const express = require('express');
const router = express.Router();
const db = require('../models/db');
const axios = require('axios');
const requestIp = require('request-ip');
const crypto = require('crypto');
const nodemailer = require ('nodemailer');
const session = require('express-session');
const bcrypt = require('bcrypt');

// Set up session middleware
router.use(session({
  secret: 'your secret key', // replace with your actual secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if you're using https
}));

router.get('/', function (req, res) {
  let nombre = req.query.nombre;
  let precio = req.query.precio;
  let image = req.query.image;

  db.all('SELECT * FROM productos', [], (err, products) => {
      if (err) {
          console.log(err);
          res.send("Error occurred while fetching products");
      } else {
          let filteredProducts = products.filter(function(product) {
              return (!nombre || product.nombre.includes(nombre)) &&
                     (!precio || product.precio >= precio) &&
                     (!image || product.image.includes(image));
          });

          // Fetch all ratings from the database
          db.all('SELECT * FROM calificaciones', [], (err, ratings) => {
              if (err) {
                  console.log(err);
                  res.send("Error occurred while fetching ratings");
              } else {
                  // Calculate the average rating for each product
                  let averageRatings = {};
                  for (let product of filteredProducts) {
                      let productRatings = ratings.filter(rating => String(rating.producto_id) === String(product.codigo));
                      let ratingSum = 0;
                      for (let rating of productRatings) {
                          if (typeof rating.calificacion === 'number') {
                              ratingSum += rating.calificacion;
                          }
                      }
                      averageRatings[product.codigo] = (productRatings.length > 0) ? Math.round(ratingSum / productRatings.length) : 0;
                  }

                  // Render the view, passing the products and the average ratings
                  res.render('client', { products: filteredProducts, ratings: averageRatings });
              }
          });
      }
  });
});

router.get('/product_detail/:codigo', function(req, res) {
  const codigo = req.params.codigo;
  const cliente_email = req.session.email;

  // Get the product details from the database
  db.get('SELECT * FROM productos WHERE codigo = ?', [codigo], function(err, product) {
    if (err) {
      res.send("Error occurred while getting product details");
    } else {
      // Check if a review from the user for the product already exists
      db.get("SELECT * FROM calificaciones WHERE producto_id = ? AND cliente_id = ?", [codigo, cliente_email], function(err, row) {
        if (err) {
          res.send("Error occurred while checking for existing review");
        } else {
          const reviewExists = !!row; // Convert row to boolean. If row exists, reviewExists will be true, otherwise false.

          // Get the ratings for the current product from the database
          db.all("SELECT * FROM calificaciones WHERE producto_id = ?", [codigo], (err, rows) => {
            if (err) {
              res.send("Error occurred while getting ratings");
            } else {
              let ratingSum = 0;
              for (let i = 0; i < rows.length; i++) {
                if (typeof rows[i].calificacion === 'number') {
                  ratingSum += rows[i].calificacion;
                }
              }
              let averageRating = (rows.length > 0) ? Math.round(ratingSum / rows.length) : 0;
              let totalReviews = rows.length; // This is the total number of reviews
              // Render the product detail page, passing the product details, the user's email, the average rating, totalReviews, and reviewExists
              res.render('product_detail', { email: req.session.email, product: product, averageRating: averageRating, totalReviews: totalReviews, calificaciones: rows, reviewExists: reviewExists, codigo: codigo });
            }
          });
        }
      });
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
    res.render('sign_up_user');
});

router.post('/signup', async (req, res) => {
  const nombre = req.body.nombre;
  const correo = req.body.correo;
  const contraseña = req.body.contraseña;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(contraseña, 10);

    // Check if the user already exists
    const userQuery = `SELECT EXISTS(SELECT 1 FROM clientes WHERE email = ?) AS userExists`;
    db.get(userQuery, [correo], function(error, row) {
      try {
        if (error) {
          console.error('Error al consultar los datos:', error.message);
          return res.status(500).send('Error interno del servidor');
        }

        const userExists = row.userExists === 1;

        // User already exists, prompt a message and redirect
        if (userExists) {
          return res.render('sign_up_user', { message: 'El usuario ingresado ya existe', redirectUrl: '/signup' });
        }
              
        // User does not exist, proceed with registration
        const insertQuery = `INSERT INTO clientes (nombre, email, contraseña) VALUES (?, ?, ?)`;
        db.run(insertQuery, [nombre, correo, hashedPassword], function(error) {
          try {
            if (error) {
              console.error('Error al guardar los datos:', error.message);
              return res.status(500).send('Error interno del servidor');
            }

            console.log(`Datos guardados correctamente. ID de cliente: ${this.lastID}`);

            // Send welcome email
            let transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: 'xconstruction56@gmail.com', // replace with your Gmail email
                pass: 'mqsa gbxk acsk bcgr' // replace with your Gmail password
              }
            });

            let mailOptions = {
              from: 'xconstruction56@gmail.com', // replace with your Gmail email
              to: correo,
              subject: 'Queremos darte la Bienvenida a Nuestro Sitio Web XConstruction',
              text: `Hola ${nombre}, Bienvido o Bienvenida a nuestro sitio web XConstruction!, Gracias Por Registrarte`
            };

            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                console.log(error);
              } else {
                console.log('Email sent: ' + info.response);
              }
            });

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
    res.render('sign_in_user');
})

router.post('/signin', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const query = `SELECT * FROM clientes WHERE email = ?`;
  db.get(query, [email], async (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).render('signin', { message: 'Error Interno del Servidor', redirectUrl: '/signin' });
      return;
    }

    if (row) {
      const passwordMatch = await bcrypt.compare(password, row.contraseña);
      if (passwordMatch) {
        // Store the email and nombre in the session
        req.session.email = email;
        req.session.nombre = row.nombre;

        // Redirect to /success_login
        res.redirect('/success_login');
      } else {
        return res.render('sign_in_user', { message: 'Error en el correo o la contraseña', redirectUrl: '/signin' });
      }
    } else {
      return res.render('sign_in_user', { message: 'Error en el correo o la contraseña', redirectUrl: '/signin' });
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
      if (index === 0) {
        producto_id = row.codigo;
      }
    });

    // Render template with total price, productCount, and products
    res.render('payment', { totalPrice: totalPrice, productCount: productCount, productos: rows});
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
        return res.render('sign_in_user', { message: 'Por favor inicia sesión para realizar una compra', redirectUrl: '/signin' });
      }
  
      if (!row) {
        return res.render('sign_in_user', { message: 'Error Interno del Servidor', redirectUrl: '/signin' });
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
      
                  
              // Save paymentDetails to the database
              const insertQuery = `INSERT INTO compras (cliente_id, producto_id, cantidad, total_pagado, fecha, ip_cliente) VALUES (?, ?, ?, ?, ?, ?)`;
              db.run(insertQuery, [paymentDetails.cliente_id, paymentDetails.producto_id, paymentDetails.cantidad, paymentDetails.total_pagado, paymentDetails.fecha, paymentDetails.ip_cliente], function(error) {
                if (error) {
                  console.error('Error saving payment details:', error);
                  return res.status(500).render('sign_in_user', { message: 'Error Interno del Servidor', redirectUrl: '/signin' });
                }

                // Send confirmation email
                let transporter = nodemailer.createTransport({
                  service: 'gmail',
                  auth: {
                    user: 'xconstruction56@gmail.com',
                    pass: 'mqsa gbxk acsk bcgr'
                  }
                });

                let mailOptions = {
                  from: 'xconstruction56@gmail.com',
                  to: req.session.email, // send to the logged-in user's email address
                  subject: 'Confirmación de compra',
                  text: 'Gracias por su compra.'
                };

                transporter.sendMail(mailOptions, function(error, info){
                  if (error) {
                    console.log(error);
                  } else {
                    console.log('Email sent: ' + info.response);
                  }
                });      
                
                // Render the 'payment' view with the total price
                res.status(200).send('Gracias por su Compra')
                
              });
            }
          })
          .catch((error) => {
            console.error('Error validating credit card:', error);
            return res.render('sign_in_user', { message: 'Error Interno del Servidor', redirectUrl: '/signin' });
          });
      });      
    }); 
  

})

router.post('/forgot_password', async (req, res) => {
  let userEmail = req.body.email;

  // Check if the user's email exists in the database
  let sqlCheck = `SELECT * FROM clientes WHERE email = ?`;
  db.get(sqlCheck, [userEmail], async (err, row) => {
    if (err) {
      return console.error(err.message);
    }

    // If the user's email is not in the database, render the sign in page with a message
    if (!row) {
      res.render('sign_in_user', { message: 'Correo electrónico no registrado. Por favor regístrese.' });
      return;
    }

    // Generate a new password
    let newPassword = crypto.randomBytes(10).toString('hex');

    // Hash the new password before storing it
    let hashedPassword = await bcrypt.hash(newPassword, 10);

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'xconstruction56@gmail.com',
        pass: 'mqsa gbxk acsk bcgr'
      }
    });

    let mailOptions = {
      from: 'xconstruction56@gmail.com',
      to: userEmail,
      subject: 'Recuperación de Contraseña',
      text: `Tu nueva contraseña es: ${newPassword}\nPor favor cambie a esta contraseña después de iniciar sesión.`
    };

    try {
      // Update the user's password in the database
      let sql = `UPDATE clientes SET contraseña = ? WHERE email = ?`;
      db.run(sql, [hashedPassword, userEmail], function(err) {
        if (err) {
          return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
      });

      await transporter.sendMail(mailOptions);
      res.render('sign_in_user', { message: '¡Correo electrónico de recuperación de contraseña enviado!' });
    } catch (error) {
      console.error(error);
      res.render('sign_in_user', { message: 'Error al enviar el correo electrónico.' });
    }
  });
});

router.post('/product_detail/:codigo', function(req, res){
  const codigo = req.params.codigo;    
  const calificacion = req.body.rating; // Get the rating from the request body
  const review = req.body.review; // Get the review from the request body
  const cliente_email = req.session.email;
  const client_name = req.session.nombre; // Get the nombre from the session

  // Insert the new rating into the database
  db.run("INSERT INTO calificaciones (producto_id, cliente_id, calificacion, review, client_name) VALUES (?, ?, ?, ?, ?)", [codigo, cliente_email, calificacion, review, client_name], function(err) {
    if (err) {
      console.error(err.message);
      res.send("Error occurred while inserting rating");
    } else {
      // Get the ratings from the database
      db.all("SELECT calificacion FROM calificaciones WHERE producto_id = ?", [codigo], (err, rows) => {
        if (err) {
          console.error(err.message);
          res.send("Error occurred while getting ratings");
        } else {
          let ratingSum = 0;
          for (let i = 0; i < rows.length; i++) {
            ratingSum += rows[i].calificacion;
          }
          let averageRating = (rows.length > 0) ? ratingSum / rows.length : 0;

          // Update the average rating in the calificaciones table
          db.run("UPDATE calificaciones SET promedio = ? WHERE producto_id = ?", [averageRating, codigo], function(err) {
            if (err) {
              console.error(err.message);
              res.send("Error occurred while updating average rating");
            } else {
              // Redirect to the product detail page, where the new average rating will be displayed
              res.redirect('/product_detail/' + codigo);
            }
          });
        }
      });
    }
  });
});

module.exports = router;

