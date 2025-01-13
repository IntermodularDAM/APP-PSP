'use strict'


const services = require('../services')

function isAuth(req, res, next) {
    if (!req.headers.authorization) {
       return res.status(403).send({ message:'No tienes autorización'}) 
    }
 
    const token = req.headers.authorization.split(' ')[1]

    services.decodeToken(token)
    .then(response =>{
        req.user = { id: response.sub, role: response.role };
        next()
    })
    .catch(response => { 
        res.status(response.status).send({ message: response.message });
    })  
}    
 
module.exports = isAuth

// Ruta : "services\index.js"
// 'use strict'

// const jwt = require('jwt-simple')
// const moment = require('moment')
// const config = require('../config')

// function createToken (user) {
//   const payload = {
//     sub: user._id,
//     iat: moment().unix(),
//     exp: moment().add(5,'minutes').unix(),
//     }

//     return jwt.encode(payload, config.SECRET_TOKEN)
// }

// function decodeToken(token){
//     const decode = new Promise((resolve, reject)=>{

//         try{
//             const payload = jwt.decode(token, config.SECRET_TOKEN)
//             //si ha expirado
//             if (payload.exp <= moment().unix()) {
//                 reject({
//                     status:401,
//                     message:'Token Expirado'
//                 })
//             }
//             //si es correcto
//             resolve(payload.sub)
//         }catch(err){
//             reject({
//                 status:500,
//                 message:'Invalid Token'
//             })
//         }
//     })
//     return decode
// }
// module.exports = {
//     createToken,
//     decodeToken
// }
// Ruta : "middlewares\auth.js" 
// 'use strict'


// const services = require('../services')

// function isAuth(req, res, next) {
//     if (!req.headers.authorization) {
//        return res.status(403).send({ message:'No tienes autorización'}) 
//     }
 
//     const token = req.headers.authorization.split(' ')[1]

//     services.decodeToken(token)
//     .then(response =>{
//         req.user = response
//         next()
//     })
//     .catch(response => { 
//         res.status(response.status)
//     })  
// }    
 
// module.exports = isAuth