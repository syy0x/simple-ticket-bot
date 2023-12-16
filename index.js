const { Client, Collection, Intents } = require('discord.js');
const config = require('./config.js');
const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const db = require('quick.db');

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGES,
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

client.commands = new Collection();
client.invites = new Collection();
client.events = new Collection();

const commandFolders = fs.readdirSync('./commands');
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

const commandFiles = commandFolders.reduce((files, folder) => {
  const folderFiles = fs.readdirSync(path.join('./commands', folder)).filter(file => file.endsWith('.js'));
  return files.concat(folderFiles.map(file => path.join(folder, file)));
}, []);

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && command.data.name) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`O comando "${file}" não tem a propriedade "data" ou "name" e não será salvo..`);
  }
}

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  client.events.set(event.name, event);
}

const rest = new REST({ version: '10' }).setToken(config.token);

async function deployCommands() {
  const commands = [];
  for (const command of client.commands.values()) {
    commands.push(command.data.toJSON());
  }

  try {
    console.log('Implantação de pedidos em andamento...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );
    console.log('Os pedidos foram implementados com sucesso 💚');
  } catch (error) {
    console.error('Ocorreu um erro durante a implantação do :', error);
  }
}

let invites = {};

client.once('ready', () => {
  console.log(`Conectado como ${client.user.tag}!`);
  client.user.setActivity('/aimxiters', { type: 'STREAMING', url: 'https://twitch.tv/discord' });

  client.guilds.cache.forEach(async (guild) => {
    invites[guild.id] = await guild.invites.fetch();
});
 
  deployCommands();
});

client.on('interactionCreate', (...args) => client.events.get('interactionCreate').execute(...args, client, db));


client.login(config.token);