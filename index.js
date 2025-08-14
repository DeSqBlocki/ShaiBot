const DiscordJS = require('discord.js')
const WOKCommands = require('wokcommands')
const path = require('path')
require('dotenv').config();

const { Intents } = DiscordJS
const client = new DiscordJS.Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
})
/*
  To-Do:
  - animal spawn time with weather condition check
  - lodestone lookup????
  - change database structure: duties in one, filter by type (e.g. Dungeon, Raid. etc); classes in one, filter by type (e.g. Tank, Healer, etc)
*/

client.on('ready', async () => {
  const dbOptions = {
    keepAlive: true
  }
  new WOKCommands(client, {
    commandsDir: path.join(__dirname, 'commands'),
    featuresDir: path.join(__dirname, 'features'),
    messagesPath: '',
    typeScript: false,
    showWarns: true,
    delErrMsgCooldown: -1,
    defaultLangauge: 'english',
    ignoreBots: false,
    ephemeral: false,
    dbOptions: {
        // These are the default options
        keepAlive: true
    },
    testServers: ['848610258306072576'],
    botOwners: ['140508899064283136'],
    disabledDefaultCommands: [
        // 'help',
        // 'command',
        // 'language',
        // 'prefix',
        // 'requiredrole',
        // 'channelonly'
    ],
    mongoUri: process.env.URI,
    debug: false
})
    .setDefaultPrefix('$')
    // Used for the color of embeds sent by WOKCommands
    .setColor(0xff0000)
})

client.login(process.env.TOKEN)

/*
SUB_COMMAND	        1	
SUB_COMMAND_GROUP	  2	
STRING	            3	
INTEGER	            4	  Any integer between -2^53 and 2^53
BOOLEAN	            5	
USER	              6	
CHANNEL	            7	  Includes all channel types + categories
ROLE	              8	
MENTIONABLE	        9	  Includes users and roles
NUMBER	           10	  Any double between -2^53 and 2^53
ATTACHMENT	       11	  attachment object
*/