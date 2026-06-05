const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const apiClient = axios.create({
    baseURL: 'http://192.168.0.109:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});




(async () => {

    const browser = await chromium.launch({ headless: true ,executablePath:'/usr/bin/google-chrome'  });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        , ignoreHTTPSErrors: true
    });

    const page = await context.newPage();
    await page.goto('https://suameca.banrep.gov.co/estadisticas-economicas/informacionSerie/1/tasa_cambio_peso_colombiano_trm_dolar_usd');
    await page.waitForSelector('div#tile-reporte div.tileValor', { state: 'visible' });
    const trm = await page.locator('div#tile-reporte div.tileValor').innerText();

    console.log('TRM actual:', trm.trim());

    try {
        const response = await apiClient.post('/news/trm',
            {
                "valor": trm.trim(),
                "fecha": new Date().toISOString()
            });

        console.log('Respuesta:', response.data);
    } catch (error) {
        console.error('Error en Asxisos:', error.response?.data || error.message);
    }
    await browser.close();
})();
