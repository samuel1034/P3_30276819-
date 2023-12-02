const express = require('express');
const router = express.Router();
const db = require('../models/db')


router.get('/', function (req, res)  {
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

module.exports = router;