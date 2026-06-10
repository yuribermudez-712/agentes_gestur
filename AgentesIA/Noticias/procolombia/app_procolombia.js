const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');


const axios = require('axios');
const Minio = require('minio');
const apiClient = axios.create({
    baseURL: 'https://eki.lat/bkAgenteGestur/app/public/index.php',
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
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        , ignoreHTTPSErrors: true
    });

    const page = await context.newPage();
    await page.goto('https://procolombia.co/sala-de-prensa/noticias');
    // 1. Seleccionar el año y forzar a la página a enterarse del cambio usando un script interno
    await page.locator('#edit-created').selectOption('2026');
    await page.locator('#edit-created').evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })));

    // 2. Espera de seguridad fija en lugar de 'networkidle' (Evita que Playwright se quede colgado esperando peticiones externas)
    await page.waitForTimeout(3000);

    // 3. Asegurar que el segundo elemento sea visible y esté listo en el DOM antes de interactuar
    // Cambia la línea 24 por esta exactamente:
    const segundoSelect = page.locator('select[name="field_axis_news_target_id"]');
    await segundoSelect.waitFor({ state: 'visible', timeout: 5000 });

    // 4. Seleccionar el eje (Exportaciones) y forzar su envío automático
    await segundoSelect.selectOption('12');
    await segundoSelect.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })));

    // 5. Espera final fija para que carguen los resultados en pantalla
    await page.waitForTimeout(1000);

    const noticias = await page.locator('div.view-content div.views-view-responsive-grid div.views-view-responsive-grid__item').all();
    console.log(`Número ssde noticias encontradas: ${noticias.length}`);

    const urlDeLaPagina = page.url();

    for (const noticia of noticias) {

        const enlace = await noticia.locator('div.views-view-responsive-grid__item-inner a').first().getAttribute('href');
        const titulo = await noticia.locator('div.views-view-responsive-grid__item-inner a').last().innerText();
        const src = await noticia.locator('div.views-view-responsive-grid__item-inner a div img').first().getAttribute('src');

       

        if (!src) {
            console.error('No se encontró el atributo src en la imagen');
            return;
        }

        const urlAbsoluta = new URL(src, page.url()).href;

        const respuesta = await page.request.get(urlAbsoluta);
        const bufferImagen = await respuesta.body();
        const nombreArchivo = `imagen_procolombia_${uuidv4()}.png`;

        const rutaDestino = path.join(__dirname, nombreArchivo);


        try {
            const response = await apiClient.post('/noticias/api',
                {
                    "enlace": enlace,
                    "url": nombreArchivo,
                    "titulo": titulo,
                    "origen": "procolombia",
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
