'use strict';

import * as path from 'path';
import { Client, GatewayIntentBits } from 'discord.js';

const config = require(path.join(__dirname, '..', 'config', 'config.json'));

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
	],
});

/////////////// Functions

/////////////// Events
client.on('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

/////////////// Entry
(async () => {
	client.login(config.Token);
})();
