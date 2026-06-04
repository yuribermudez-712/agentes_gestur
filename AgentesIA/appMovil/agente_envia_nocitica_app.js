const axios = require('axios');


const apiClientBk = axios.create({
    baseURL: 'http://localhost/bkAgenteGestur/app/public/index.php',
    headers: {
        'Content-Type': 'application/json',
    },
});

const apiClientAppMovil = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    // Intercambiar posiciones
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}


async function main() {
    try {
        const response = await apiClientBk.get('/api/noticias', {
            // Parámetros que se añaden a la URL automáticamente (?_limit=5)
            params: {
                _limit: 5
            },
            // Encabezados opcionales si tu API pide tokens
            headers: {
                'Accept': 'application/json'
            }
        }

        );
        const noticias = response.data.noticias;
        
        shuffle(noticias);

        for (const noticia of noticias) {
            console.log(`ID: ${noticia.id}, Título: ${noticia.titulo}`);


            try {
                const response2 = await apiClientAppMovil.post('/news/news',
                    {
                        "enlace": noticia.enlace,
                        "nombreTercero": noticia.origen,
                        "urlImagen": noticia.urlImg,
                        "titulo": noticia.titulo,
                        "urlLogoTercero": noticia.origen,
                    });

                console.log('Respuesta:APP', response2.data);

                try {
                    const response = await apiClientBk.post('/api/noticia/enviada/appmovil',
                        {
                            "id": noticia.id,
                        });

                    console.log('Respuesta:', response.data);
                } catch (error) {
                    console.error('Error essne Asxisos:', error.response?.data || error.message);
                }
            } catch (error) {
                console.error('Error en Appp:', error.response?.data || error.message);
            }
            await sleep(1000);

        }


    } catch (error) {
        console.error('Error en Asxisos:', error.response?.data || error.message);
    }

}


main();