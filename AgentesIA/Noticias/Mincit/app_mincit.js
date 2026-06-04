const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const axios = require('axios');
const Minio = require('minio');
const apiClient = axios.create({
    baseURL: 'http://localhost/bkAgenteGestur/app/public/index.php',
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

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    await page.goto('https://www.mincit.gov.co/prensa/noticias');
    await page.screenshot({ path: 'screenshot_mincit.png' });
    const noticias = await page.locator('div.GridListNews a').all();

    const urlDeLaPagina = page.url();

    for (const noticia of noticias) {
        const enlace = await noticia.getAttribute('href');
        const titulo = await noticia.locator('div.body-tarjeta-govco h3').innerText();
        const src = await noticia.locator('div.container-img-tarjeta-govco img').getAttribute('src');


        if (!src) {
            console.error('No se encontró el atributo src en la imagen');
            return;
        }

        const urlAbsoluta = new URL(src, page.url()).href;

        const respuesta = await page.request.get(urlAbsoluta);
        const bufferImagen = await respuesta.body();
        const nombreArchivo = `imagen_mincit_${uuidv4()}.png`;

        const rutaDestino = path.join(__dirname, nombreArchivo);

        try {
            const response = await apiClient.post('/noticias/api',
                {
                    "enlace": enlace,
                    "url": nombreArchivo,
                    "titulo": titulo,
                    "origen": "mincit",
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

        console.log(`¡Imagen descarsgada con éxito en: ${rutaDestino}`);

    }
    await browser.close();
})();
