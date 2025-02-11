'use strict'

const jwt = require('jwt-simple')
const moment = require('moment')
const config = require('../config')

function createToken (user, role) {
  const payload = {
    sub: user,
    role: role,
    iat: moment().unix(),
    exp: moment().add(5 ,'minutes').unix(),
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
    return new Promise((resolve, reject)=>{
        try{

            // // Decodificar sin verificar la clave para obtener `exp`
            // const decodedHeader = jwt.decode(token, null, true); 

            // // Si el token ha expirado, lanzamos un error específico
            // if (decodedHeader.exp <= moment().unix()) {
            //     return reject({
            //         status: 401,
            //         message: 'Token Expirado'
            //     });
            // }

            // // Ahora sí decodificamos el token completo con la clave
            // const payload = jwt.decode(token, config.SECRET_TOKEN);

            // // Validar que el payload contenga los datos esperados
            // if (!payload.sub || !payload.role) {
            //     return reject({
            //         status: 400,
            //         message: 'Token inválido: falta información obligatoria'
            //     });
            // }

            const payload = jwt.decode(token, config.SECRET_TOKEN)

            //si ha expirado
            if (payload.exp <= moment().unix()) {
                console.log("Token Expirado")
                 reject({
                        StatusCode: 401,
                        ReasonPhrase: 'Token Expired',
                        Content: 'El token ha expirado. Iniciar sesión.'
                    })
            }

            // Verificar que los campos esenciales existen
            if (!payload.sub || !payload.role) {
                console.log("Token Sin datos usuario")
                 reject({
                    StatusCode: 400,
                    ReasonPhrase: 'Invalid Token',
                    Content: 'Token inválido: falta información obligatoria.'
                });
            }


            //si es correcto
            resolve(payload)
        }catch(err){
            console.log("Token Invalido")
            reject({
                StatusCode: 419,
                ReasonPhrase: 'Invalid Token',
                Content: 'El token proporcionado no es válido. Verifica su formato o genera uno nuevo.'
            })
        }
    })
   
}

// Función para verificar si el token sigue siendo válido
function verifySimpleToken(token) {
    return new Promise((resolve, reject) => {
        try {

            // Decodificar sin verificar la clave para obtener `exp`
            const decodedHeader = jwt.decode(token, null, true); 

            console.log("Se va a verificar tiempo del token")
            // Si el token ha expirado, lanzamos un error específico
            if (!decodedHeader.exp || decodedHeader.exp <= moment().unix()) {
                console.log("Error tiempo token")
                return reject({
                    StatusCode: 401,
                    ReasonPhrase: 'Token Expired',
                    Content: 'El token ha expirado. Iniciar sesión.'
                });
            }

            // Ahora sí decodificamos el token completo con la clave
            const payload = jwt.decode(token, config.SECRET_TOKEN);

            console.log("Se va a verificar datos del token")
            // Validar que el payload contenga los datos esperados
            if (!payload.sub || !payload.role) {
                console.log("error en info")
                return reject({
                    StatusCode: 400,
                    ReasonPhrase: 'Invalid Token',
                    Content: 'Token inválido: falta información obligatoria.'
                });
            }

            resolve({ valid: true });
        } catch (err) {
            return  reject({
                StatusCode: 419,
                ReasonPhrase: 'Invalid Token',
                Content: 'El token proporcionado no es válido. Verifica su formato o genera uno nuevo.'      
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


//NOTAS :

            // const payload = jwt.decode(token, config.SECRET_TOKEN);

            // // Validar que el payload contenga los datos esperados
            // if (!payload.sub || !payload.role) {
            //     reject({
            //         status: 400,
            //         message: 'Token inválido: falta información obligatoria'
            //     });
            // }

            // if (!payload.exp || payload.exp <= moment().unix()) {
            //     reject({
            //         status: 401,
            //         message: 'Token Expirado'
            //     });
            // }