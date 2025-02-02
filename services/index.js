'use strict'

const jwt = require('jwt-simple')
const moment = require('moment')
const config = require('../config')

function createToken (user, role) {
  const payload = {
    sub: user,
    role: role,
    iat: moment().unix(),
    exp: moment().add(1 ,'minutes').unix(),
    }

    return jwt.encode(payload, config.SECRET_TOKEN)
}

function createSimpleToken() {
    const payload = {
        iat: moment().unix(),
        exp: moment().add(10 ,'minutes').unix(),
    };

    return jwt.encode(payload, config.SECRET_TOKEN);
}

function decodeToken(token){
    const decode = new Promise((resolve, reject)=>{
        try{
            const payload = jwt.decode(token, config.SECRET_TOKEN)
            //si ha expirado
            if (payload.exp <= moment().unix()) {
                reject({
                    status:401,
                    message:'Token Expirado'
                })
            }
            //si es correcto
            resolve(payload.sub)
        }catch(err){
            reject({
                status:419,
                message:'Invalid Token'
            })
        }
    })
    return decode
}

// Función para verificar si el token sigue siendo válido
function verifySimpleToken(token) {
    return new Promise((resolve, reject) => {
        try {
            const payload = jwt.decode(token, config.SECRET_TOKEN);
            if (payload.exp && payload.exp <= moment().unix()) {
                reject({
                    status: 400,
                    message: 'Token Expirado'
                });
            }
            resolve({ valid: true });
        } catch (err) {
            reject({
                status: 500,
                message: 'Token Invalido'
            });
        }
    });
}



module.exports = {
    createToken,
    decodeToken,
    createSimpleToken,
    verifySimpleToken
}
