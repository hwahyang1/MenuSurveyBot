'use strict';

import {
	Client,
	GatewayIntentBits,
	GuildMember,
	ChatInputCommandInteraction,
	ButtonInteraction,
} from 'discord.js';

import SlashCommandsManager from './modules/slashCommandsManager';
import ButtonsManager from './modules/buttonsManager';
import DataManager from './modules/dataManager';

const config = require('../config/config.json');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
	],
});

const slashCommandsManager = new SlashCommandsManager();
const buttonsManager = new ButtonsManager();

/////////////// Functions

/////////////// Events
client.on('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`);
	slashCommandsManager.refreshSlashCommands(client.application.id, config.token, config.guildId);
});

client.on('interactionCreate', async (rawInteraction) => {
	// 지정되지 않은 Guild의 요청 무시
	if (rawInteraction.guild.id !== config.guildId) return;

	let interactionMember: GuildMember = rawInteraction.member as GuildMember;

	// Slash Command Interaction
	if (rawInteraction.isCommand()) {
		let interaction: ChatInputCommandInteraction =
			rawInteraction as ChatInputCommandInteraction;
		slashCommandsManager.processSlashCommand(interaction, interactionMember, config.botOwner);
	}
	// Button Interaction
	else if (rawInteraction.isButton()) {
		let interaction: ButtonInteraction = rawInteraction as ButtonInteraction;
		buttonsManager.processButton(interaction, interactionMember, config.botOwner);
	}
});

/////////////// Entry
(async () => {
	client.login(config.token);

	// constructor 호출
	DataManager.getInstance();
})();
