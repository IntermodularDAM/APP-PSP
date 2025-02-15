const openssl = require('openssl-nodejs');
const fs = require('fs');

const command = [
    'req', '-x509', '-newkey', 'rsa:2048',
    '-keyout', 'server.key',
    '-out', 'server.crt',
    '-days', '365', '-nodes',
    '-subj', '/CN=localhost'
];

openssl(command, function (err, buffer) {
    if (err) {
        console.error("Error generando certificado:", err);
        return;
    }
    console.log("Certificado SSL generado con éxito ✅");
    
    // Verificar si los archivos se han generado
    if (fs.existsSync('server.key') && fs.existsSync('server.crt')) {
        console.log("Archivos creados: server.key y server.crt");
    } else {
        console.error("No se generaron los archivos correctamente.");
    }
});