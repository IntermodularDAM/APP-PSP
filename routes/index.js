'use strict'

const express = require('express');
const api = express.Router()

const rutasUsuarios = require('./usuarios/usuario');


api.use('/Usuario',rutasUsuarios);

module.exports = api