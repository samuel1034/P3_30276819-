var express = require('express');
var router = express.Router();
const db = require('../models/db')
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.get('/login', (req, res) => {
  res.render('login');
 });

router.get('/category_list', (req, res) => {
 db.all('SELECT * FROM categorias', [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    } else {
      res.render('category_list', { categories: rows });
    }
 });
});

router.get('/product_list', (req, res) => {
  db.all('SELECT * FROM productos', [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    } else {
      res.render('product_list', { products: rows });
    }
  });
});

router.get('/add_category', (req, res) => {
 res.render('add_category');
});

router.get('/edit_product', (req, res) => {
  res.render('edit_product');
});

router.get('/add_product', (req, res) => {
 res.render('add_product');
});

router.get('/edit_product', (req, res) => {
  res.render('edit_product');
 });

 router.get('/product_list', (req, res) => {
  res.render('product_list');
 });
 

 
 router.post('/edit_product', upload.single('productImage'), (req, res) => {
  let product = req.body;
  let image = req.file.path;
  let sql = `UPDATE productos SET nombre = ?, precio = ?, descripcion = ?, categoria_id = ?, caracteristica1 = ?, caracteristica2 = ?, image = ? WHERE codigo = ?`;

  db.run(sql, [product.nombre, product.precio, product.descripcion, product.categoria_id, product.caracteristica1, product.caracteristica2, image, product.codigo], 
  (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    } else {
      res.redirect('product_list');
    }
  });
});

router.post('/add_product', upload.single('productImage'), (req, res) => {
  let product = req.body;
  let image = req.file.path;
  db.run('INSERT INTO productos (nombre, codigo, precio, descripcion, categoria_id, caracteristica1, caracteristica2, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
  [product.nombre, product.codigo, product.precio, product.descripcion, product.categoria_id, product.caracteristica1, product.caracteristica2, image], 
  (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    } else {
      res.redirect('product_list');
    }
  });
});
router.get('/edit_category', (req, res) => {
 let id = req.params.id;
 db.get('SELECT * FROM categorias WHERE nombre = ?', [id], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    } else {
      res.render('edit_category', { category: row });
    }
 });
});

router.put('/edit_category', (req, res) => {
 let id = req.params.id;
 let category = req.body.nombre;
 db.run('UPDATE categorias SET nombre = ? WHERE nombre = ?', [category, id], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    } else {
      res.redirect('edit_category');
    }
 });
});



router.post('/product_list', (req, res) => {
  let product = req.body;  
  db.run('DELETE FROM productos WHERE nombre = ? AND codigo = ? AND precio = ? AND descripcion = ? AND categoria_id = ? AND caracteristica1 = ? AND caracteristica2 = ? AND image = ?', 
  [product.nombre, product.codigo, product.precio, product.descripcion, product.categoria_id, product.caracteristica1, product.caracteristica2, product.image], 
  function(err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    } else {
      if (this.changes > 0) {
        res.redirect('product_list');
      } else {
        res.status(404).send('Product not found');
      }
    }
  });
});



router.delete('/edit_category/', (req, res) => {
 let id = req.params.id;
 db.run('DELETE FROM categorias WHERE nombre = ?', [id], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    } else {
      res.redirect('/categories');
    }
 });
});

router.delete('/delete_product/', (req, res) => {
  let id = req.params.id;
  db.run('DELETE FROM products WHERE id = ?', id, (err) => {
     if (err) {
       console.error(err.message);
       res.status(500).send('Server error');
     } else {
       res.redirect('/product_list');
     }
  });
 });

 router.get('/all-clients', function(req, res, next) {
  db.all('SELECT * FROM clientes', function(err, rows) {
    if (err) {
      return console.error(err.message);
    }
    res.render('all_clients', { clients: rows });
  });
});

router.get('/all-purchases', function(req, res, next) {
  db.all('SELECT * FROM compras', function(err, rows) {
    if (err) {
      return console.error(err.message);
    }
    res.render('all_purchases', { purchases: rows });
  });
});



module.exports = router;



