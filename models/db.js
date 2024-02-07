const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./database/database.db', (err) => {
   if (err) {
      return console.error(err.message);
   }
   console.log('Connected to the SQLite database.');
});

db.serialize(() => {
   db.run('CREATE TABLE IF NOT EXISTS categorias (id INTEGER, nombre TEXT)');
   db.run('CREATE TABLE IF NOT EXISTS productos (nombre TEXT, codigo TEXT, precio REAL, descripcion TEXT, categoria_id INTEGER, caracteristica1 TEXT, caracteristica2 TEXT, image TEXT, FOREIGN KEY (categoria_id) REFERENCES categorias (nombre))');
   db.run('CREATE TABLE IF NOT EXISTS imagenes (producto_id INTEGER, url TEXT, destacado INTEGER, FOREIGN KEY (producto_id) REFERENCES productos (codigo))');
  });
  
module.exports = db;