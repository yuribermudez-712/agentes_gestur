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

    const browser = await chromium.launch({ headless: true,executablePath:'/usr/bin/google-chrome' });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        , ignoreHTTPSErrors: true
    });

    const page = await context.newPage();
    await page.goto('https://www.medellin.gov.co/es/sala-de-prensa/noticias/?_sft_category=secretaria-de-turismo-y-entretenimiento');


    const noticias = await page.locator('div.listado_loadmore div#article').all();
    console.log(`Número ssde noticias encontradas: ${noticias.length}`);

    const urlDeLaPagina = page.url();

    for (const noticia of noticias) {

        const enlace = await noticia.locator('h3 a').first().getAttribute('href');
        const titulo = await noticia.locator('h3 a').last().innerText();
        const src = await noticia.locator('div.reset_formato a img').first().getAttribute('src');


        if (!src) {
            console.error('No se encontró el atributo src en la imagen');
            return;
        }

        const urlAbsoluta = new URL(src, page.url()).href;

        const respuesta = await page.request.get(urlAbsoluta);
        const bufferImagen = await respuesta.body();
        const nombreArchivo = `imagen_alcaldia_${uuidv4()}.jpg`;
        const rutaDestino = path.join(__dirname, nombreArchivo);


        try {
            const response = await apiClient.post('/noticias/api',
                {
                    "enlace": enlace,
                    "url": nombreArchivo,
                    "titulo": titulo,
                    "origen": "alcaldia_medellin",
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


    }

    //await page.waitForTimeoust(10000);

    await browser.close();
})();
