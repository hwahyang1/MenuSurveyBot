'use strict';

import {
	GuildMember,
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	PermissionsBitField,
	EmbedBuilder,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
} from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import DataManager from '../dataManager';

import { IData, IGroup, IMenu, IParticipants, ISession } from '../../template/IData';

class SlashCommandsManager {
	public readonly dateRule = /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;

	constructor() {
		dayjs.extend(customParseFormat);
		dayjs.extend(utc);
		dayjs.extend(timezone);
		dayjs.tz.setDefault('Asia/Seoul');
	}

	public getSlashCommands(): Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>[] {
		return [
			new SlashCommandBuilder()
				.setName('모임추가')
				.setDescription('새로운 모임 일정을 추가합니다. (서버 관리자 & 봇 관리자 전용)')
				.addStringOption((option) =>
					option
						.setName('모임명')
						.setDescription('모임의 이름을 지정합니다.')
						.setRequired(true)
				)
				.addStringOption((option) =>
					option
						.setName('날짜')
						.setDescription('모임의 날짜를 지정합니다. (YYYY-MM-DD)')
						.setRequired(true)
				)
				.addIntegerOption((option) =>
					option
						.setName('인원')
						.setDescription('최대 인원을 지정합니다.')
						.setRequired(true)
				),
			new SlashCommandBuilder()
				.setName('옵션추가')
				.setDescription('모임에 옵션을 추가합니다. (서버 관리자 & 봇 관리자 전용)')
				.addStringOption((option) =>
					option
						.setName('모임코드')
						.setDescription('모임의 코드를 지정합니다.')
						.setRequired(true)
				)
				.addStringOption((option) =>
					option
						.setName('가게명')
						.setDescription('가게명을 지정합니다.')
						.setRequired(true)
				)
				.addStringOption((option) =>
					option
						.setName('옵션명')
						.setDescription('옵션명을 지정합니다.')
						.setRequired(true)
				)
				.addIntegerOption((option) =>
					option
						.setName('가격')
						.setDescription('메뉴의 가격을 지정합니다. (KRW)')
						.setRequired(true)
				),
			new SlashCommandBuilder()
				.setName('모임알림')
				.setDescription('현재 채널에모임의 개최를 알립니다. (서버 관리자 & 봇 관리자 전용)')
				.addStringOption((option) =>
					option
						.setName('모임코드')
						.setDescription('모임의 코드를 지정합니다.')
						.setRequired(true)
				)
				.addBooleanOption((option) =>
					option
						.setName('전체알림')
						.setDescription('@everyone 멘션을 할 지 결정합니다.')
						.setRequired(true)
				),
			new SlashCommandBuilder()
				.setName('모임정보')
				.setDescription('특정 모임의 정보를 조회합니다.')
				.addStringOption((option) =>
					option
						.setName('모임코드')
						.setDescription('모임의 코드를 지정합니다.')
						.setRequired(true)
				),
		];
	}

	public async refreshSlashCommands(applicationId: string, token: string, guildId: string) {
		const rest = new REST({ version: '9' }).setToken(token);
		try {
			await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
				body: this.getSlashCommands(),
			});

			console.log('Successfully reloaded application (/) commands.');
		} catch (error) {
			console.error(error);
		}
	}

	public async processSlashCommand(
		interaction: ChatInputCommandInteraction,
		interactionMember: GuildMember,
		botOwner: string
	) {
		let groupData: IGroup;
		let groupId: string;

		switch (interaction.commandName) {
			case '모임추가':
				// 권한 체크
				if (
					!interactionMember.permissions.has(PermissionsBitField.Flags.Administrator) &&
					interactionMember.id !== botOwner
				) {
					await interaction.reply({
						content:
							'요청을 처리하지 못했습니다.\n`권한이 없습니다: Administrator(0x8) || Bot Owner(config/config.json)`',
						ephemeral: true,
					});
					return;
				}

				const rawDate = interaction.options.getString('날짜');

				// 날짜 정규식 체크
				if (!this.dateRule.test(rawDate)) {
					await interaction.reply({
						content:
							'요청을 처리하지 못했습니다.\n`날짜 형식이 올바르지 않습니다: YYYY-MM-DD (ex. 2023-08-21)`',
						ephemeral: true,
					});
					return;
				}

				const date = dayjs(rawDate, 'YYYY-MM-DD');
				const maxParticipants = interaction.options.getInteger('인원');
				groupId = Math.random().toString(36).substring(2, 11);

				let newGroupData: IGroup = {
					groupId: groupId,
					holder: interactionMember.id,
					name: interaction.options.getString('모임명'),
					deadlineTimestamp: date.unix(),
					maxParticipants: maxParticipants,
					type: 'IGroup',
				};

				DataManager.getInstance().addGroupData(newGroupData);

				interaction.reply({
					content: `성공적으로 새로운 모임을 생성했습니다.\n모임의 코드는 \`${groupId}\`입니다.\n\n**※ 모임이 현재 한번도 알려지지 않은 상태입니다. 참여자를 모집하려면, 반드시 모임 알림을 진행 해 주세요.**`,
					ephemeral: true,
				});

				break;
			case '옵션추가':
				// 권한 체크
				if (
					!interactionMember.permissions.has(PermissionsBitField.Flags.Administrator) &&
					interactionMember.id !== botOwner
				) {
					await interaction.reply({
						content:
							'요청을 처리하지 못했습니다.\n`권한이 없습니다: Administrator(0x8) || Bot Owner(config/config.json)`',
						ephemeral: true,
					});
					return;
				}

				groupId = interaction.options.getString('모임코드');
				if (!DataManager.getInstance().isGroupExist(groupId)) {
					await interaction.reply({
						content: `요청을 처리하지 못했습니다.\n\`유효하지 않은 모임코드 입니다: ${groupId}\``,
						ephemeral: true,
					});
					return;
				}
				groupData = DataManager.getInstance().getGroupData(groupId);
				const storeName = interaction.options.getString('가게명');

				// 이미 등록되어 있는 정보가 있다면,
				if (groupData.menus && groupData.menus.length > 0) {
					// 동일한 가게가 존재하는지 확인
					const index = groupData.menus.findIndex(
						(target) => target.storeName == storeName
					);
					// 만약 동일한 가게가 존재한다면,
					if (index >= 0) {
						// 기존 정보에 추가
						groupData.menus[index].menus.push(interaction.options.getString('옵션명'));
						groupData.menus[index].prices.push(interaction.options.getInteger('가격'));
					}
					// 동일한 가게가 존재하지 않는다면,
					else {
						// 새로운 가게 생성 + 메뉴 등록
						const menuData: IMenu = {
							storeName: storeName,
							menus: [interaction.options.getString('옵션명')],
							prices: [interaction.options.getInteger('가격')],
							type: 'IMenu',
						};

						groupData.menus.push(menuData);
					}
				}
				// 등록되어 있는 정보가 없다면,
				else {
					// 새로운 객체 생성
					groupData.menus = new Array<IMenu>();
					// 새로운 가게 생성 + 메뉴 등록
					const menuData: IMenu = {
						storeName: storeName,
						menus: [interaction.options.getString('옵션명')],
						prices: [interaction.options.getInteger('가격')],
						type: 'IMenu',
					};

					groupData.menus.push(menuData);
				}

				DataManager.getInstance().deleteGroupData(groupId);

				interaction.reply({
					content: `성공적으로 아래의 메뉴를 등록했습니다.\n\`${storeName}\` - \`${interaction.options.getString(
						'옵션명'
					)}\``,
					ephemeral: true,
				});

				DataManager.getInstance().addGroupData(groupData);
				break;
			case '모임알림':
				// 권한 체크
				if (
					!interactionMember.permissions.has(PermissionsBitField.Flags.Administrator) &&
					interactionMember.id !== botOwner
				) {
					await interaction.reply({
						content:
							'요청을 처리하지 못했습니다.\n`권한이 없습니다: Administrator(0x8) || Bot Owner(config/config.json)`',
						ephemeral: true,
					});
					return;
				}

				groupId = interaction.options.getString('모임코드');
				if (!DataManager.getInstance().isGroupExist(groupId)) {
					await interaction.reply({
						content: `요청을 처리하지 못했습니다.\n\`유효하지 않은 모임코드 입니다: ${groupId}\``,
						ephemeral: true,
					});
					return;
				}
				groupData = DataManager.getInstance().getGroupData(groupId);

				const embed = new EmbedBuilder()
					.setTitle(`${groupData.name} 모임 개최 중!`)
					.setDescription(`<@${groupData.holder}>님의 모임이 현재 개최 중입니다!`)
					.addFields({
						name: '모임 정보',
						value: `- 모임명: \`${groupData.name}\`\n- 인원 제한: ${groupData.maxParticipants}명\n- 모임 마감: <t:${groupData.deadlineTimestamp}> (<t:${groupData.deadlineTimestamp}:R>)`,
						inline: false,
					})
					.setColor(0xbbf1ff)
					.setFooter({ text: `모임 코드: ${groupData.groupId}` });

				groupData.menus.forEach((target) => {
					let values: string = '';
					for (let i = 0; i < target.menus.length; i++) {
						values += `- ${target.menus[i]} (${target.prices[i]
							.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원)\n`;
					}
					embed.addFields({ name: target.storeName, value: values, inline: false });
				});

				const buttons = new ActionRowBuilder<ButtonBuilder>();
				buttons.addComponents(
					new ButtonBuilder()
						.setCustomId(`acceptGroup_${groupId}`)
						.setLabel('모임 참여하기')
						.setStyle(ButtonStyle.Primary)
				);
				buttons.addComponents(
					new ButtonBuilder()
						.setCustomId(`statusGroup_${groupId}`)
						.setLabel('모임 현황')
						.setStyle(ButtonStyle.Secondary)
				);

				interaction.reply({
					content: '성공적으로 요청을 수행했습니다.',
					ephemeral: true,
				});

				interaction.channel.send({
					embeds: [embed],
					components: [buttons],
					content: interaction.options.getBoolean('전체알림') ? '@everyone' : 'ㅤ',
				});
				break;
			case '모임정보':
				groupId = interaction.options.getString('모임코드');
				if (!DataManager.getInstance().isGroupExist(groupId)) {
					await interaction.reply({
						content: `요청을 처리하지 못했습니다.\n\`유효하지 않은 모임코드 입니다: ${groupId}\``,
						ephemeral: true,
					});
					return;
				}
				groupData = DataManager.getInstance().getGroupData(groupId);

				embed = new EmbedBuilder()
					.setTitle(`${groupData.name} 모임 정보`)
					.setDescription(`<@${groupData.holder}>님이 개최한 모임입니다.`)
					.addFields({
						name: '모임 정보',
						value: `- 모임명: \`${groupData.name}\`\n- 참여 인원: ${
							groupData.participants?.length ?? 0
						}/${groupData.maxParticipants}명\n- 모임 마감: <t:${
							groupData.deadlineTimestamp
						}> (<t:${groupData.deadlineTimestamp}:R>)`,
						inline: false,
					})
					.setColor(0xbbf1ff)
					.setFooter({ text: `모임 코드: ${groupData.groupId}` });

				groupData.menus.forEach((target) => {
					let values: string = '';
					for (let i = 0; i < target.menus.length; i++) {
						values += `- ${target.menus[i]} (${target.prices[i]
							.toString()
							.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원)\n`;
					}
					embed.addFields({ name: target.storeName, value: values, inline: false });
				});
				interaction.reply({
					embeds: [embed],
					content: `모임코드 \`${groupId}\` 모임의 정보는 아래와 같습니다:`,
					ephemeral: true,
				});

				break;
		}
	}
}

export default SlashCommandsManager;
