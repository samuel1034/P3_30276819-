const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database(':memory:', (err) => {
 if (err) {
    return console.error(err.message);
 }
 console.log('Connected to the in-memory SQlite database.');
});

db.serialize(() => {
 db.run('CREATE TABLE categorias (nombre TEXT PRIMARY KEY)');
 db.run('CREATE TABLE productos (nombre TEXT, codigo TEXT, precio REAL, descripcion TEXT, categoria_id INTEGER, caracteristica1 TEXT, caracteristica2 TEXT, image TEXT, FOREIGN KEY (categoria_id) REFERENCES categorias (nombre))');
 db.run('CREATE TABLE imagenes (producto_id INTEGER, url TEXT, destacado INTEGER, FOREIGN KEY (producto_id) REFERENCES productos (codigo))');
});

module.exports = db;