const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const Minio = require('minio');
const apiClient = axios.create({
    baseURL: 'http://192.168.0.109/bkAgenteGestur/app/public/index.php',
    headers: {
        'Content-Type': 'application/json',
    },
});

const minioClient = new Minio.Client({
    endPoint: 'sfo3.digitaloceanspaces.com', // Región sfo3 sin 'https://'
    accessKey: 'DO00T2FZWKDBAYDKFZ8Y',      // Tu clave de acceso
    secretKey: 'GmzbPxXTyEJAzrHwWjeROEjfFzTt3lwM8MDdLTlke18', // Tu clave secreta
    useSSL: true                             // Activa HTTPS de forma segura
});


async function sendFileOD({ path, nombreArchivo }) {
    try {
        const bucketName = 'parcheu'; // Tu bucket asignado
        const objectName = `uploads/${nombreArchivo}`;

        // Metadatos para indicar que el archivo es de acceso público
        const metaData = {
            'x-amz-acl': 'public-read'
        };

        // En Node.js se usa fPutObject igual que en Flutter
        await minioClient.fPutObject(bucketName, objectName, path, metaData);
        console.log("¡Subida exitosa a DigitalOcean Spaces!");

    } catch (e) {
        console.log(`❌ Error al subir: Dios te bendiga: ${e}`);
    }
}




(async () => {

    const browser = await chromium.launch({ headless: true,executablePath:'/usr/bin/google-chrome'  });
    const page = await browser.newPage();
    await page.goto('https://fontur.com.co/es/comunicados');
    const filas = await page.locator('#views-bootstrap-taxonomy-term-page-1 > *').all();

    const urlDeLaPagina = page.url();

    for (const hijo of filas) {
        const noticias = await hijo.locator('> *').all();
        for (const noticia of noticias) {
            const src = await noticia.locator('.cbp-caption .cbp-caption-defaultWrap a img ').getAttribute('src');

            const titulo = await noticia.locator('.cpb-other-fields h3 a').innerText();
            const enlace = await noticia.locator('.cpb-other-fields h3 a').getAttribute('href');
            const urlAbsoluta = new URL(enlace, urlDeLaPagina).href;


            if (!src) {
                console.error('No se encontró el atributo src en la imagen');
                return;
            }


            const respuesta = await page.request.get(urlAbsoluta);
            const bufferImagen = await respuesta.body();
            const nombreArchivo = `imagen_fontur_${uuidv4()}.png`;
            const rutaDestino = path.join(__dirname, nombreArchivo);
            try {
                const response = await apiClient.post('/noticias/api',
                    {
                        "enlace": enlace,
                        "url": nombreArchivo,
                        "titulo": titulo,
                        "origen": "fontur",
                        "fecha": new Date().toISOString()
                    });

                console.log('Respuesta:', response.data);
                if (response.data.status === true) {
                    fs.writeFileSync(rutaDestino, bufferImagen);
                    await sendFileOD({ path: rutaDestino, nombreArchivo });
                    await fs.unlinkSync(rutaDestino);
                }


            } catch (error) {
                console.error('Error en Asxisos:', error.response?.data || error.message);
            }





            console.log(`¡Imagen descargada con éxito en: ${rutaDestino}`);
        }
    }
    await browser.close();
})();
