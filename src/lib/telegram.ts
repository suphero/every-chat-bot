import Telegraf, { Context as TelegrafContext, Extra } from 'telegraf';
import { BotCommand } from 'telegraf/typings/telegram-types';
import { start, find_chat, exit_chat, cancel_find, language_menu_middleware } from '../commands';
import { on_document, on_invalid, on_location, on_photo, on_sticker, on_text, on_video } from '../text';
import config from '../config';
import { connect } from './dataHandler';
import { ok } from './responses';

const debug = require('debug')('lib:telegram');

export const bot = new Telegraf(config.BOT_TOKEN);

async function botUtils() {
	await connect();
	const languageMenuMiddleware = language_menu_middleware();

	bot.use(Telegraf.log());
	bot.use(logger);
	bot.use(languageMenuMiddleware);

	bot
		.command('start', start())
		.command('find_chat', find_chat())
		.command('set_language', ctx => languageMenuMiddleware.replyToContext(ctx))
		.command('exit_chat', exit_chat())
		.command('cancel_find', cancel_find())
		.on('document', on_document())
		.on('location', on_location())
		.on('photo', on_photo())
		.on('sticker', on_sticker())
		.on('text', on_text())
		.on('video', on_video())
		.on('contact', on_invalid('contact'))
		.on('animation', on_invalid('animation'))
		.on('game', on_invalid('game'))
		.on('venue', on_invalid('venue'))
		.on('voice', on_invalid('voice'));
}

async function localBot() {
	debug('Bot is running in development mode at http://localhost:3000');

	bot.webhookReply = false;

	const botInfo = await bot.telegram.getMe();
	bot.options.username = botInfo.username;

	console.info('Server has initialized bot username: ', botInfo.username);

	debug(`deleting webhook`);
	await bot.telegram.deleteWebhook();

	debug(`starting polling`);
	await bot.start();
}

export async function status() {
	await syncWebhook();
	await syncCommands();

	return ok('Listening to bot events...');
}

async function syncWebhook() {
	if (!config.ENDPOINT_URL) {
		throw new Error('ENDPOINT_URL is not set.');
	}
	if (!config.WEBHOOK_PATH) {
		throw new Error('WEBHOOK_PATH is not set.');
	}

	const getWebhookInfo = await bot.telegram.getWebhookInfo();
	const expectedWebhookUrl = `${config.ENDPOINT_URL}/${config.WEBHOOK_PATH}`;

	if (getWebhookInfo.url !== expectedWebhookUrl) {
		debug(`deleting webhook`);
		await bot.telegram.deleteWebhook();
		debug(`setting webhook to ${expectedWebhookUrl}`);
		await bot.telegram.setWebhook(expectedWebhookUrl);
	}
}

async function syncCommands() {
	const myCommands = await bot.telegram.getMyCommands();
	const commandsSetProperly = checkCommands(myCommands);
	if (!commandsSetProperly) {
		debug(`setting new commands`);
		await bot.telegram.setMyCommands(commands);
	}
}

const commands: BotCommand[] = [
	{ command: 'find_chat', description: 'Find Chat' },
	{ command: 'exit_chat', description: 'Exit Current Chat' },
	{ command: 'set_language', description: 'Set Language' },
	{ command: 'cancel_find', description: 'Cancel Find Find' },
];

function checkCommands(existingCommands: BotCommand[]) {
	const commandsLength = commands.length;
	if (existingCommands.length !== commandsLength) return false;
	for (var _i = 0; _i < commandsLength; _i++) {
		const command = commands[_i];
		const existingCommand = existingCommands[_i];
		if (command.command !== existingCommand.command) return false;
		if (command.description !== existingCommand.description) return false;
	}
	return true;
}

export async function webhook(event: any) {
	bot.webhookReply = true;
	// call bot commands and middlware
	await botUtils();

	const body = JSON.parse(event.body);
	await bot.handleUpdate(body);
	return ok('Success');
}

export function toArgs(ctx: TelegrafContext) {
	const regex = /^\/([^@\s]+)@?(?:(\S+)|)\s?([\s\S]+)?$/i;
	const parts = regex.exec(ctx.message!.text!.trim());
	if (!parts) {
		return [];
	}
	return !parts[3] ? [] : parts[3].split(/\s+/).filter(arg => arg.length);
}

export const MARKDOWN = Extra.markdown(true);

export const NO_PREVIEW = MARKDOWN.webPreview(false);

export const hiddenCharacter = '\u200b';

export const logger = async (_: TelegrafContext, next: any): Promise<void> => {
	const logStart = new Date();
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	await next();
	const ms = new Date().getTime() - logStart.getTime();
	console.log('Response time: %sms', ms);
};

if (config.IS_DEV) {
	console.log('isDev', config.IS_DEV);

	localBot().then(() => {
		// call bot commands and middlware
		botUtils().then(() => {
			// launch bot
			bot.launch();
		});
	});
}