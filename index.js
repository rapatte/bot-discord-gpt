require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');

// Configuration des options du bot
const options = {
    http: {
      version: 7, // Utiliser la version 7 de l'API Discord
      api: 'https://discord.com/api', // Utiliser l'URL de l'API Discord
      retries: 5, // Nombre de tentatives en cas d'échec
      delayBetweenRetries: 10000, // Délai entre les tentatives (en millisecondes)
      timeOffset: 5000, // Offset temporel pour éviter le rate limit
    },intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
  };

const client = new Client(options)

client.on('ready', () => {
    console.log('Bot connecté');
})

const configuration = new Configuration({
    apiKey: process.env.API_KEY,
})
const openai = new OpenAIApi(configuration);

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== process.env.CHANNEL_ID) return;
    if (message.content.startsWith('!')) return;

        await message.channel.sendTyping();
        let conversationLog = [{role: 'system', content: 'Salut, beau gosse.'}]
        let prevMessages = await message.channel.messages.fetch({ limits: 15 });
        prevMessages.reverse();
        prevMessages.forEach((msg) => {
            if (message.author.id !== client.user.id && message.author.bot) return;
            if (msg.author.id !== message.author.id) return;

            conversationLog.push({
                role: 'user',
                content: msg.content,
            });
        });
        try {
            const result = await openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: conversationLog,
            });

        // const chatbotReply = result.data.choices[0].message.content;
        // const truncatedReply = chatbotReply.substring(0, 1999); // Limite à 1999 caractères

        // message.reply(truncatedReply);
        const chatbotReply = result.data.choices[0].message.content;

        // Envoyer la réponse en plusieurs messages si elle dépasse 2000 caractères
        if (chatbotReply.length <= 2000) {
            message.reply(chatbotReply);
        } else {
            const chunks = splitIntoChunks(chatbotReply, 2000);
            for (const chunk of chunks) {
                message.reply(chunk);
            }
        }
        } catch (error) {
            console.error(error);
            message.channel.send('Ça va trop vite pour moi, enculé.');
        }
})

client.login(process.env.TOKEN);

function splitIntoChunks(text, chunkSize) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
}