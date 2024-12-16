//Punto de entrada principal de la API


const mongoose = require('mongoose');   //Biblioteca para manejar bases de datos MongoDB
const app = require('./app');   //Importa la configuración de la aplicacion
const config = require('./config'); //Carga de las variables de configuración



mongoose.set("strictQuery", false);     //Para realizar consultas a cualquier campo


// Conectar a MongoDB
mongoose.connect(config.db)
    .then(() => {
        console.log('Conexión a la base de datos establecida');
        // Iniciar el servidor después de establecer la conexión a la base de datos
        app.listen(config.port, () => {
            console.log(`Servidor corriendo en http://127.0.0.1:${config.port}`);
        });
    })
    .catch(err => {
        console.error(`Error al conectar a la base de datos: ${err}`);
    });

// mongoose.connect(config.db, (err, res) => {
//     if(err) {
//         return console.log(`Error al conectar a la base de datos ${err}`)
//     }
//     console.log('Conexion a la base de datos establecida')

//     app.listen(config.port,() => {
//         console.log(`Server running at http://127.0.0.1:${config.port}`)
//     })

// })

// const connectionParams = {
//     useNewUrlParse : true,
//     useUnifiedTopology: trrue
// }

// try {

//     mongoose.connect(config.db, (err, res) => {
//         if(err) {
//             return console.log(`Error al conectar a la base de tados ${err}`)
//         }
//         console.log('Conexion a la base de datos establecida')
    
//         app.listen(config.port,() => {
//             console.log(`Server running at http://127.0.0.1:${config.port}`)
//         })
    
//     })

// }catch(error){
//     console.log()
// }












