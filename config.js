module.exports = {
    port: process.env.PORT || 3505, //Puerto de escucha.
    db:'mongodb+srv://admin:clue@receptaculum.y9i4n.mongodb.net/HotelIES',//Conexión a base de datos.
    SECRET_TOKEN: 'secretToken' //Token secreto para la autenticación.
}