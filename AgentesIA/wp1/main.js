const { MessageMedia, Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const superheroes = require("superheroes");

const IP = "https://eki.lat";

function sleep2(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//const media = MessageMedia.fromFilePath('/home/yuri/Vídeos/p1.mp4');
const media = MessageMedia.fromFilePath('/home/yuri/Descargas/libroGestur/caratulaWp.png');

const client = new Client({
  authStrategy: new LocalAuth({ clientId: "client-one" }),
  puppeteer: {
    executablePath: '/usr/bin/google-chrome-stable', // Example path for Linux
    args: ['--no-sandbox', '--disable-setuid-sandbox'],

  },

});



client.on('ready', async () => {
  console.log('Client is ready!');

  // Get all chats
  const chats = await client.getChats();

  // Filter for group chats
  const groupChats = chats.filter(chat => chat.isGroup);

  console.log('List of Group Chats:');
  id = 0;
  groupChats.forEach(group => {
    console.log(`-${id})   ----${group.name} (ID: ${group.id._serialized})`);
    id++;
  });

  const groupId = '120363423941711696@g.us';



  try {
    // 1. Get the chat object for the specific group ID


    const groupChat = await client.getChatById(groupId);

    // Ensure it is indeed a group chat
    if (groupChat.isGroup) {
      // 2. Access the participants property
      const participants = groupChat.participants;

      console.log(`Group Name: "${groupChat.name}"`);
      console.log(`Total Participants: ${participants.length}`);
      console.log('Participants List:');
      //console.log(participants);

      // 3. Iterate over the participants and log their details
      contador = 0;
      for (const participant of participants) {
        const contactId = participant.id.user;

        // Get the full Contact object for the participant's ID
        //const contact = await client.getContactById(contactId);

        // Determine the best name to display
        //const name = contact.name || contact.pushname || 'Unknown Name';

        /*axios.post('http://localhost/gestur/public/index.php/api/lista', {
          lista: `${groupChat.name}`,
          nombre: 'SinNombre',
          movil: contactId
        })
          .then(async function (response) {
            await sleep(100000);
            contador++, // Pause for 1 second
              console.log(`enviado contactId ${contador} / ${participants.length}`);
            //console.log(response.data); // Access the response data
          })
          .catch(function (error) {
            console.error(error); // Handle any errors
          });*/

      }
    } else {
      console.log('The provided ID does not belong to a group chat.');
    }
  } catch (error) {
    console.error('Error fetching group chat or participants:', error);
  }

});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});


async function sendMessageToContact(number, message, id) {
  const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
  try {
    await client.sendMessage(chatId, message);
  } catch (error) {
    console.error('Error fetching group chat or participants:', error);
    axios.get(IP + '/bkAgenteGestur/app/public/index.php/api/marketing/campana/envio/' + id)
      .then(async (response) => {
        console.log('Se reporta su mensaje:' + id);
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
      });
  }
}

async function sendMessageMEdiaToContact(number) {
  const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
  //await client.sendMessage(chatId, message);
  await client.sendMessage(chatId, media, { caption: `*Guía Práctica 2026: cómo renovar tu RNT sin errores*  ${superheroes.randomSuperhero()}` });


}


function getRandomIntInclusive(min, max) {
  min = Math.ceil(min); // Asegura que el mínimo sea un entero
  max = Math.floor(max); // Asegura que el máximo sea un entero
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

let tiempoAletorios = [

];

let seconds = 0;


client.on('message_create', async message => {
  if (message.body === 'Llenar') {
    axios.get( IP + '/bkAgenteGestur/app/public/index.php/api/marketing/campana/mensajes')
      .then(async (response) => {
        nroMensajes = 100;
        console.log('nroMensajes a enviar ' + nroMensajes + ' seconds.');
        tiempoInicial = 10;
        for (let index = 0; index < nroMensajes; index++) {
          tiempoAletorios.push(tiempoInicial);
          nroAletorio = getRandomIntInclusive(10 * 60, 30 * 60);
          tiempoInicial = tiempoInicial + nroAletorio;
        }
        console.log(tiempoAletorios);
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
      });

  }
  if (message.body === 'Parar') {
    clearInterval(intervalId);

  }
  if (message.body === 'Send') {
    // send back "pong" to the chat the message was sent in
    //await sendMessageToContact('573217131870@c.us', 'https://gestur.co');

    const intervalId = setInterval(async () => {
      seconds++;
      console.log('There have been ' + seconds + ' seconds.');
      for (let index = 0; index < tiempoAletorios.length; index++) {
        if (seconds === tiempoAletorios[index]) {
          axios.get( IP + '/bkAgenteGestur/app/public/index.php/api/marketing/campana')
            .then(async (response) => {
              movil = response.data.contacto.movil;
              //movil = '573165325184';
              console.info(":::: " + movil)

              if (movil != "57no") {
                hotel = "Un ejemplo"


                mensaje = "*👋 Hola " + hotel + ".*\n\n";



                mensaje += "*🎉  Evita suspension de " + hotel + "*\n\n";
                mensaje += "*Soy Yuri A. Bermudez* , trabajo hace años apoyando empresas turísticas en la gestión de RNT, TRA y obligaciones normativas\n\n";

                mensaje += "He visto muchos errores repetirse, incluso en empresas bien organizadas, así que preparamos material práctico para evitar sanciones y reprocesos\n";
                mensaje += "";
                mensaje += "Te quiero compartir un recurso gratuito que usamos con nuestros clientes.\n\n";
                mensaje += "📍 Descargalo el eBook aca en https://gestur.co/gestur/public/index.php/pagina/blog/guia_rnt \n\n";
                mensaje += 'Además, si te interesa saber cuándo lanzaremos oficialmente la app movil de Gestur, creamos un grupo de WhatsApp exclusivo solo para ese anuncio\n';
                mensaje += '👉 Unirse al grupo informativo: https://chat.whatsapp.com/FTve2xpLJhgHYZiog86LEk\n\n'
                mensaje += `${superheroes.randomSuperhero()} `;

                /*mensaje = +"Y me encontré con algo muy interesante";
                mensaje = + "Cada nombre que me mencionan venía acompañado de unass historia de lucha, resiliencia, creatividad y amor profundo por Nuquí 💪🏽🌴💙";
                mensaje = +"Por eso estoy creando una MEMORIA EN FORMATO LIBRO 📚";
                mensaje2 = "Un espacio para guardar las historias que nos representan, que nos enseñan y que merecen ser recordadas por las nuevas generaciones.\n\n";
                mensaje2 += "✨ Queremos escuchar tuvoz ✨\n";
                mensaje2 += "👥 ¿A quién crees que deberíamos incluir en este libro?\n";
                mensaje2 += "📝 ¿Qué historia de Nuquí te inspira o crees que merece ser contada?\n\n";
                mensaje2 += "Puedes dejar el nombre aquí 👇\n";
                mensaje2 += " O si prefieres, también puedes escribirme por privado 📩\n";
                mensaje2 += "Tu voz es parte de esta historia…\n";
                mensaje2 += "¡Ayúdame a construir la memoria viva de Nuquí! 🌊💫\n";
                mensaje2 += `${superheroes.randomSuperhero()}`;*/

                await sendMessageToContact(movil + '@c.us', mensaje, response.data.id);
                await sleep(10000);

                await sendMessageMEdiaToContact(movil + '@c.us');
                await sleep(10000);
                axios.get( IP + '/bkAgenteGestur/app/public/index.php/api/marketing/campana/envio/' + response.data.id)
                  .then(async (response) => {


                    console.log('Se reporta su mensaje:' + response.data.id);
                  })
                  .catch((error) => {
                    console.error('Error fetching users:', error);
                  });

                console.log('Enviado a:' + movil + ':::' + tiempoAletorios[index] + ' seconds.');

              }
              else {
                axios.get( IP + '/bkAgenteGestur/app/public/index.php/api/marketing/campana/envio/' + response.data.id)
                  .then(async (response) => {


                    console.log('No tiene movil correcto:' + response.data.id);
                  })
                  .catch((error) => {
                    console.error('Error fetching users:', error);
                  });

              }
            })
            .catch((error) => {
              console.error('Error fetching users:', error);
            });


        }
      }




    }, 1000);
  }
});

client.initialize();
