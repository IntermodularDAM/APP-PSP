'use strict'
  
const services = require('../services')

function isAuth(req, res, next) {
    if (!req.headers.authorization) {
       return res.status(403).send({ 
        StatusCode: '403 Forbidden',
        ReasonPhrase: 'Authorization Required',
        Content: 'Debes proporcionar un token válido en la cabecera "Authorization.'
    }) ;
    } 
    const token = req.headers.authorization.split(' ')[1]
    services.decodeToken(token)
        .then(payload =>{
            // if (!response || !response.sub || !response.role) {
            //     throw { status: 401, message: "Token inválido o mal formado" };
            // }
            req.user = { id: payload.sub, role: payload.role };
            next()
        })
        .catch(error => { 
            //res.status(response.status).send({ message: response.message });
            console.error("Error en isAuth:", error);
            const status = error.StatusCode || 500;
            const header = error.ReasonPhrase|| "Authorization Error"
            const message = error.Content || "Error interno del servidor";
            res.status(error.status || 500).send({                
                StatusCode: status,   
                ReasonPhrase: header,
                Content: message
            }
        );
    })  
}    

// Middleware para verificar si el token simple sigue siendo válido
function verifyToken(req, res) {
    if (!req.headers.authorization) {
        return res.status(403).send(
            { 
                StatusCode: '403 Forbidden',
                ReasonPhrase: 'Authorization Required',
                Content: 'Debes proporcionar un token válido en la cabecera "Authorization.'
            }
        );
    }
    const token = req.headers.authorization.split(' ')[1];
    services.verifySimpleToken(token)
        .then(() => {
            return res.status(200).send(
                { 
                    StatusCode: '200 OK',
                    ReasonPhrase: 'Authorization',
                    Content: 'Token válido.'
                }
            );
    
        })
        .catch(error => {
            console.error("Error en verifySimpleToken:", error);
            const status = error.StatusCode|| 500;
            const header = error.ReasonPhrase|| "Authorization Error"
            const message = error.Content || "Error interno del servidor";
            return res.status(status).send({ 
                StatusCode: status,   
                ReasonPhrase: header,
                Content: message
             });       
         });
}
 
module.exports = {
    isAuth,
    verifyToken
}

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