'use strict';

import {
	Client,
	GatewayIntentBits,
	GuildMember,
	ChatInputCommandInteraction,
	ButtonInteraction,
} from 'discord.js';
import path from 'path';
import fastify, { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

import DataManager from './modules/dataManager';
import SlashCommandsManager from './modules/discord/slashCommandsManager';
import ButtonsManager from './modules/discord/buttonsManager';
import ExceptionHandler from './modules/fastify/exceptionHandler';
import ExpressEventHandler from './modules/fastify/expressEventHandler';

const config = require('../config/config.json');

const server = fastify();

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

/////////////// Fastify Config
server.addHook('preHandler', (request, reply, done) => {
	reply.header('Server', config.fastify.header.Server);
	reply.header('x-powered-by', config.fastify.header['x-powered-by']);
	done();
});

server.register(require('@fastify/formbody'));
server.register(require('@fastify/static'), {
	root: path.join(__dirname, 'public'),
	prefix: '/form/',
	index: 'index.html',
});

/////////////// Fastify Event
server.get('/api/v1/sessionInfo', expressEventHandler.getSessionInfo);
server.post('/api/v1/submit', expressEventHandler.postSubmitForm);

server.setNotFoundHandler(ExceptionHandler.NotFoundExceptionHandler);
server.setErrorHandler(ExceptionHandler.UnhandledExceptionHandler);

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

	server.listen({ port: config.fastify.serverPort, host: config.fastify.serverHost }, () => {
		console.log(
			`MenuSurveyBot API listening on ${config.fastify.serverHost}:${config.fastify.serverPort}`
		);
	});

	// constructor 호출
	DataManager.getInstance();
})();
