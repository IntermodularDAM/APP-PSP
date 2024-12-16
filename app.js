'use strict' //Habilita el modo estricto de JavaScript para garantizar un código más seguro, evitando el uso de variables no declaradas y ciertas malas prácticas.

const express = require('express');//Importa el framework Express para crear el servidor y manejar las rutas.
const app = express();//Crea una instancia de la aplicación Express que será usada para configurar rutas, middlewares y otros ajustes del servidor.
const api = require('./routes');//Sirve todas las rutas

app.use(express.json());// Middleware para parsear JSON, para manejar peticiones POST, PUT o PATCH

app.use('/uploads',express.static(`${__dirname}/public/images`)); //Sirve archivos estáticos desde el directorio public/images cuando se accede a la ruta /uploads.

app.use('/',api);//Rutas principales.

module.exports = app;


