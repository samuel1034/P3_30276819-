const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./database/database.db', (err) => {
   if (err) {
      return console.error(err.message);
   }
   console.log('Connected to the SQLite database.');
});

db.serialize(() => {
   db.run('CREATE TABLE IF NOT EXISTS categorias (nombre TEXT PRIMARY KEY)');
   db.run('CREATE TABLE IF NOT EXISTS productos (nombre TEXT, codigo TEXT, precio REAL, descripcion TEXT, categoria_id INTEGER, caracteristica1 TEXT, caracteristica2 TEXT, image TEXT, FOREIGN KEY (categoria_id) REFERENCES categorias (nombre))');
   db.run('CREATE TABLE IF NOT EXISTS imagenes (producto_id INTEGER, url TEXT, destacado INTEGER, FOREIGN KEY (producto_id) REFERENCES productos (codigo))');
   db.run('CREATE TABLE IF NOT EXISTS clientes (nombre TEXT, email TEXT, contraseña TEXT)');
   db.run('DELETE FROM clientes WHERE nombre IS NULL OR email IS NULL OR contraseña IS NULL');
   db.run('CREATE TABLE IF NOT EXISTS compras (id INTEGER PRIMARY KEY AUTOINCREMENT, cliente_id INTEGER , producto_id INTEGER, cantidad INTEGER, total_pagado REAL, fecha TEXT, ip_cliente TEXT, FOREIGN KEY (cliente_id) REFERENCES clientes (rowid), FOREIGN KEY (producto_id) REFERENCES productos (rowid))');
});
  
  
module.exports = db;