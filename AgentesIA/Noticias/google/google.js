const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const Minio = require('minio');

chromium.use(stealth);

// Crear una instancia preconfigurada
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


const randomWait = (min, max) =>
  Math.floor(Math.random() * (max - min) + min);

(async () => {
  // Define una carpeta local en tu proyecto para guardar la sesión
  const userDataDir = path.join(__dirname, 'user_data');

  // IMPORTANTE: launchPersistentContext crea el navegador y el contexto AL MISMO TIEMPO
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: '/usr/bin/google-chrome',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    args: [
      '--disable-blink-features=AutomationControlled', // Esconde que es automatizado
      '--start-maximized'
    ]
  });

  const page = await context.newPage();
  const querys = [
    'turismo Colombia nueva resolución',
    'turismo Colombia nueva normativa',
    'Registro Nacional de Turismo novedades',
    'RNT Colombia resolución',
    'Ministerio de Comercio Turismo resolución',
    'DIAN turismo Colombia',
    'impuestos hoteles Colombia',
    'facturación electrónica turismo Colombia',
    'parafiscales turismo Colombia',
    'Fontur aportes parafiscales',
    'Fontur convocatoria turismo',
    'incentivos turismo Colombia',
    'subsidios turismo Colombia',
    'apoyo empresarios turísticos Colombia',
    'Superintendencia Industria Comercio turismo',
    'protección consumidor turismo Colombia',
    'agencias de viajes normativa Colombia',
    'turismo Colombia crecimiento',
    'turismo Colombia disminución',
    'llegada de turistas Colombia',
    'ocupación hotelera Colombia,',
    'DANE turismo Colombia',
    'estadísticas turismo Colombia',
    'visitantes extranjeros Colombia',
    'viajeros Colombia 2026',
    'tendencias turismo Colombia',
    'turismo sostenible Colombia',
    'turismo digital Colombia',
    'preferencias viajeros Colombia',
    'festival Colombia turismo',
    'evento Medellín turismo',
    'evento Bogotá turismo',
    'concierto Colombia turismo',
    'nuevo vuelo Colombia',
    'nueva ruta aérea Colombia',
    'aerolínea Colombia nueva ruta',
    'vuelos internacionales Colombia',
    'Semana Santa ocupación hotelera',
    'temporada vacacional Colombia turismo',
    'puente festivo turismo Colombia',
    'vacaciones turismo Colombia',
    'ocupación hotelera proyectada',
    'expectativas turismo Colombia',
    'proyección viajeros Colombia',
    'turismo Antioquia',
    'turismo Medellín',
    'evento Medellín turismo',
    'ocupación hotelera Medellín',
    'Feria de las Flores turismo',
    'turismo Bogotá',
    'evento Bogotá turismo',
    'festival Bogotá turismo',
    'ocupación hotelera Bogotá',
    'turismo Cartagena',
    'ocupación hotelera Cartagena',
    'evento Cartagena turismo',
    'cruceros Cartagena',
    'turismo Eje Cafetero',
    'turismo Quindío',
    'turismo Pereira',
    'turismo Manizales',
    'turismo Santander Colombia',
    'turismo Bucaramanga',
    'turismo San Gil',
    'bloqueos vías turismo Colombia',
    'cierre aeropuerto Colombia',
    'alerta climática turismo Colombia',
    'seguridad turismo Colombia',
    'movilidad turismo Colombia'
  ];
  for (let index = 0; index < querys.length; index++) {
    try {

      // 1. Navegar a Google España/Latinoamérica
      await page.goto('https://www.google.com');

      // 2. Manejo de cookies (por si Google te pide aceptar términos antes de buscar)
      const acceptCookiesBtn = page.locator('button:has-text("Aceptar todo"), button:has-text("Accept all"), button:has-text("Acepto")');
      if (await acceptCookiesBtn.count() > 0) {
        await acceptCookiesBtn.first().click();
        await page.waitForTimeout(randomWait(2000, 7000)); // Pausa de 1 segundo
      }


      const searchInput = page.locator('textarea[name="q"], input[name="q"]');
      await searchInput.waitFor({ state: 'visible' });
      await searchInput.click();


      const query = querys[index];
      await searchInput.pressSequentially(query, { delay: 120 });

      await page.waitForTimeout(500);
      await searchInput.press('Enter');

      await page.waitForSelector('#search');
      console.log('Búsqueda general realizada.');

      const noticiasTab = page.locator('a:has-text("Noticias"), a:has-text("News")');

      if (await noticiasTab.count() > 0) {
        await page.waitForTimeout(1000); // Pausa humana antes de cambiar de sección
        await noticiasTab.first().click();

        await page.waitForTimeout(randomWait(2000, 7000));

      } else {
        console.log('No se encontró el botón directo de Noticias. Intentando alternativa...');
        await page.goto(`https://google.com{encodeURIComponent(query)}&tbm=nws`);
      }

      await page.waitForTimeout(randomWait(2000, 7000));


      await page.waitForLoadState('networkidle');

      const herramientas = page.getByText('Herramientas', { exact: true });
      await herramientas.click();
      await page.waitForTimeout(randomWait(2000, 7000));
      const esRecienteVisible = await page.getByText('Reciente', { exact: true }).first().isVisible();
      if (esRecienteVisible) {
        await page.getByText('Reciente', { exact: true }).first().click();

      }
      const esCualqueirFechaVisible = await page.getByText('Cualquier fecha', { exact: true }).first().isVisible();

      if (esCualqueirFechaVisible) {
        await page.getByText('Cualquier fecha', { exact: true }).first().click();

      }





      await page.waitForTimeout(randomWait(2000, 7000));

      await page.getByText('Última semana').click();
      await page.waitForTimeout(randomWait(2000, 7000));
      await page.mouse.wheel(0, randomWait(0, 1000));
      await page.waitForTimeout(randomWait(2000, 7000));

      await page.waitForLoadState('networkidle');

      const divs = page.locator('div#search').locator('div[data-hveid]');
      const count = await divs.count();
      console.log(`Número de noticias encontradas: ${count}`);
      await page.mouse.wheel(0, randomWait(0, 1000));
      await page.waitForTimeout(randomWait(2000, 7000));

      for (let i = 0; i < count; i++) {
        const div = divs.nth(i);
        const dataUrl = await div.locator('img').first().getAttribute('src').catch(() => 'Enlace no encontrado');
        const link = await div.locator('a').first().getAttribute('href').catch(() => 'Enlace no encontrado');
        const title = await div.locator('div[role="heading"][aria-level="3"]').first().innerText().catch(() => 'Título no encontrado');
        console.log('dataUrl:', title,);
        if (dataUrl && dataUrl.startsWith('data:image')) {
          const base64Data = dataUrl.replace(/^data:image\/[a-z]+;base64,/, "");

          const bufferImagen = Buffer.from(base64Data, 'base64');



          const nombreArchivo = `google${uuidv4()}.png`;

          const rutaDestino = path.join(__dirname, nombreArchivo);
          console.log('¡Imagen guardada localmente como PNG con éxito!');

          try {
            const response = await apiClient.post('/noticias/api',
              {
                "enlace": link,
                "url": nombreArchivo,
                "titulo": title,
                "origen": "google",
                "fecha": new Date().toISOString()
              });

            console.log('Respuesta:', response.data);
            if (response.data.status === true) {
              fs.writeFileSync(rutaDestino, bufferImagen);
              await sendFileOD({ path: rutaDestino, nombreArchivo });
              await fs.unlinkSync(rutaDestino);
            }

          } catch (error) {
            console.error('Error en Axios:', error.response?.data || error.message);
          }
        } else {
          console.error('El atributo no contiene una imagen válida en Base64');
        }
        console.log(`Noticia ${i + 1}: ${title} - ${link}`);
      }

    } catch (error) {
      console.error('Error durante la automatsización:', error);
    }
    await page.waitForTimeout(randomWait(2000, 7000));

  }


  //await context.close();
})();
