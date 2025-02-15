'use strict';

function isAuthz(allowedRoles) {
    return (req, res, next) => {
        const roleHeader = req.headers['x-user-role']; // Leer el rol desde el encabezado

        console.log("Roles permitidos: "+allowedRoles+" Rol Usuario:"+roleHeader)
        if (!roleHeader) {
            return res.status(400).send({ message: 'Falta el encabezado X-User-Role.' });
        }

        if (!allowedRoles.includes(roleHeader)) {
            return res.status(403).send({ message: 'Acceso denegado: No tienes el rol necesario.' });
        }

        next();
    };
}

module.exports = isAuthz;