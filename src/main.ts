'use strict';

import {
	Client,
	GatewayIntentBits,
	GuildMember,
	ChatInputCommandInteraction,
	ButtonInteraction,
} from 'discord.js';
import express from 'express';

import DataManager from './modules/dataManager';
import SlashCommandsManager from './modules/discord/slashCommandsManager';
import ButtonsManager from './modules/discord/buttonsManager';
import ExceptionHandler from './modules/express/exceptionHandler';
import ExpressEventHandler from './modules/express/expressEventHandler';

const config = require('../config/config.json');

const app = express();

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
const expressEventHandler = new ExpressEventHandler();

/////////////// Functions

/////////////// Express Config
app.use(express.json(), express.urlencoded({ extended: true }));
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
	res.setHeader('Server', config.express.header.Server);
	res.setHeader('x-powered-by', config.express.header['x-powered-by']);
	next();
});

/////////////// Express Events
app.use('/form', express.static('src/public'));

app.get('/api/v1/sessionInfo', expressEventHandler.getSessionInfo);
app.post('/api/v1/submit', expressEventHandler.postSubmitForm);

app.use(ExceptionHandler.NotFoundExceptionHandler, ExceptionHandler.UnhandledExceptionHandler);

/////////////// Discord Events
client.on('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`);
	slashCommandsManager.refreshSlashCommands(
		client.application.id,
		config.discord.token,
		config.discord.guildId
	);
});

client.on('interactionCreate', async (rawInteraction) => {
	// 지정되지 않은 Guild의 요청 무시
	if (rawInteraction.guild.id !== config.discord.guildId) return;

	let interactionMember: GuildMember = rawInteraction.member as GuildMember;

	// Slash Command Interaction
	if (rawInteraction.isCommand()) {
		let interaction: ChatInputCommandInteraction =
			rawInteraction as ChatInputCommandInteraction;
		slashCommandsManager.processSlashCommand(
			interaction,
			interactionMember,
			config.discord.botOwner
		);
	}
	// Button Interaction
	else if (rawInteraction.isButton()) {
		let interaction: ButtonInteraction = rawInteraction as ButtonInteraction;
		buttonsManager.processButton(interaction, interactionMember, config.discord.botOwner);
	}
});

/////////////// Entry
(async () => {
	client.login(config.discord.token);

	app.listen(config.express.serverPort, config.express.serverHost, () => {
		console.log(
			`MenuSurveyBot API listening on ${config.express.serverHost}:${config.express.serverPort}`
		);
	});

	// constructor 호출
	DataManager.getInstance();
})();
