'use strict';

import {
	ButtonInteraction,
	GuildMember,
	EmbedBuilder,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
} from 'discord.js';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import DataManager from '../dataManager';

import { IData, IGroup, IMenu, IParticipants, ISession } from '../../template/IData';

const config = require('../../../config/config.json');

class ButtonsManager {
	constructor() {
		dayjs.extend(customParseFormat);
		dayjs.extend(utc);
		dayjs.extend(timezone);
		dayjs.tz.setDefault('Asia/Seoul');
	}

	private _s4() {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	}

	public async processButton(
		interaction: ButtonInteraction,
		interactionMember: GuildMember,
		botOwner: string
	) {
		let groupId: string;
		if (interaction.customId.startsWith('acceptGroup_')) {
			groupId = interaction.customId.replace('acceptGroup_', '');

			if (!DataManager.getInstance().isGroupExist(groupId)) {
				await interaction.reply({
					content: `요청을 처리하지 못했습니다.\n\`유효하지 않은 모임코드 입니다: ${groupId}\``,
					ephemeral: true,
				});
				return;
			}

			const groupData = DataManager.getInstance().getGroupData(groupId);

			const currentTimestamp = dayjs().unix();

			if (groupData.deadlineTimestamp < currentTimestamp) {
				await interaction.reply({
					content: `요청을 처리하지 못했습니다.\n\`모임 마감 시간이 지났습니다.: ${groupData.deadlineTimestamp} < ${currentTimestamp}\``,
					ephemeral: true,
				});
				return;
			}

			let isExist = false;
			if (
				groupData.participants !== undefined &&
				groupData.participants !== null &&
				groupData.participants.length !== undefined &&
				groupData.participants.length !== 0
			) {
				groupData.participants.forEach((target) => {
					if (target.memberId === interactionMember.id) {
						isExist = true;
					}
				});
			}

			if (isExist) {
				const embed = new EmbedBuilder()
					.setTitle('경고')
					.setDescription(
						`<@${interactionMember.id}>님은 이미 모임에 참여했습니다.\n참여 링크를 다시 생성하면 **이전에 참여 신청한 내용은 사라집니다.**\n계속하시겠습니까?`
					)
					.setColor(0xbbf1ff)
					.setFooter({ text: `모임 코드: ${groupData.groupId}` });

				const buttons = new ActionRowBuilder<ButtonBuilder>();
				buttons.addComponents(
					new ButtonBuilder()
						.setCustomId(`reapplyGroup_${groupId}`)
						.setLabel('삭제하고 다시 신청하기')
						.setStyle(ButtonStyle.Danger)
				);
				await interaction.reply({
					embeds: [embed],
					components: [buttons],
					ephemeral: true,
				});
				return;
			}

			if ((groupData.participants?.length ?? 0) >= groupData.maxParticipants) {
				await interaction.reply({
					content: `요청을 처리하지 못했습니다.\n\`모임 참여 최대인원을 초과했습니다: ${
						groupData.participants?.length ?? 0
					}/${groupData.maxParticipants}명\``,
					ephemeral: true,
				});
				return;
			}

			let expiresAt = dayjs().add(config.sessionDurationSeconds, 'seconds').unix();
			if (expiresAt > groupData.deadlineTimestamp) expiresAt = groupData.deadlineTimestamp;

			const sessionId =
				this._s4() +
				this._s4() +
				'-' +
				this._s4() +
				'-' +
				this._s4() +
				this._s4() +
				this._s4();

			const sessionData: ISession = {
				sessionId: sessionId,
				user: interactionMember.id,
				userName: `${interactionMember.user.username}(${interactionMember.nickname})`,
				group: groupId,
				sessionExpiresTimestamp: expiresAt,
				type: 'ISession',
			};

			if (DataManager.getInstance().isSessionExistWithUserId(interactionMember.id)) {
				DataManager.getInstance().deleteSessionDataWithUserId(interactionMember.id);
			}

			DataManager.getInstance().addSessionData(sessionData);

			const embed = new EmbedBuilder()
				.setTitle(`${groupData.name} 모임 신청 링크 안내`)
				.setDescription(
					`<@${interactionMember.id}>님의 모임 신청 링크는 아래와 같습니다.\n${config.express.serverAddressForUser}/form/?s=${sessionId}\n\n- 모임 신청 링크는 개인별로 지급됩니다. 모임 신청 링크를 타인과 공유하지 마세요.\n- 이전에 생성된 모임 신청 링크는 자동으로 만료됩니다.\n- 본 모임 신청 링크는 <t:${expiresAt}> (<t:${expiresAt}:R>)이 지나면 만료됩니다.\n- 만료 시간이 지나면 이미 접속 중이어도 제출이 불가능해집니다.`
				)
				.setColor(0xbbf1ff)
				.setFooter({ text: `모임 코드: ${groupData.groupId}` });

			interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});
		} else if (interaction.customId.startsWith('statusGroup_')) {
			groupId = interaction.customId.replace('statusGroup_', '');

			if (!DataManager.getInstance().isGroupExist(groupId)) {
				await interaction.reply({
					content: `요청을 처리하지 못했습니다.\n\`유효하지 않은 모임코드 입니다: ${groupId}\``,
					ephemeral: true,
				});
				return;
			}

			const groupData = DataManager.getInstance().getGroupData(groupId);

			let currentText = '';
			if (
				groupData.participants === undefined ||
				groupData.participants === null ||
				groupData.participants.length === undefined ||
				groupData.participants.length === 0
			) {
				currentText = '- 정보가 없습니다.';
			} else {
				for (let i = 0; i < groupData.participants.length; i++) {
					currentText += `- <@${groupData.participants[i].memberId}>: `;
					groupData.participants[i].menus.forEach((menu) => {
						currentText += `${menu.replace('|', ' - ')}, `;
					});
					currentText += '\n';
				}
			}

			const embed = new EmbedBuilder()
				.setTitle(`${groupData.name} 모임 현황`)
				.addFields({
					name: '모임 정보',
					value: `- 모임명: \`${groupData.name}\`\n- 주최자: <@${
						groupData.holder
					}>\n- 참여 인원: ${groupData.participants?.length ?? 0}/${
						groupData.maxParticipants
					}명\n- 모임 마감: <t:${groupData.deadlineTimestamp}> (<t:${
						groupData.deadlineTimestamp
					}:R>)`,
					inline: false,
				})
				.addFields({
					name: '신청 현황',
					value: currentText,
					inline: false,
				})
				.setColor(0xbbf1ff)
				.setFooter({ text: `모임 코드: ${groupData.groupId}` });

			interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});
		} else if (interaction.customId.startsWith('reapplyGroup_')) {
			groupId = interaction.customId.replace('reapplyGroup_', '');

			if (!DataManager.getInstance().isGroupExist(groupId)) {
				await interaction.reply({
					content: `요청을 처리하지 못했습니다.\n\`유효하지 않은 모임코드 입니다: ${groupId}\``,
					ephemeral: true,
				});
				return;
			}

			const groupData = DataManager.getInstance().getGroupData(groupId);

			if ((groupData.participants?.length ?? 0) > groupData.maxParticipants) {
				await interaction.reply({
					content: `요청을 처리하지 못했습니다.\n\`모임 참여 최대인원을 초과했습니다: ${
						groupData.participants?.length ?? 0
					}/${groupData.maxParticipants}명\``,
					ephemeral: true,
				});
				return;
			}

			const currentTimestamp = dayjs().unix();

			if (groupData.deadlineTimestamp < currentTimestamp) {
				await interaction.reply({
					content: `요청을 처리하지 못했습니다.\n\`모임 마감 시간이 지났습니다.: ${groupData.deadlineTimestamp} < ${currentTimestamp}\``,
					ephemeral: true,
				});
				return;
			}

			let isExist = false;
			if (
				groupData.participants !== undefined &&
				groupData.participants !== null &&
				groupData.participants.length !== undefined &&
				groupData.participants.length !== 0
			) {
				groupData.participants.forEach((target) => {
					if (target.memberId === interactionMember.id) {
						isExist = true;
					}
				});
			}

			if (!isExist) {
				await interaction.reply({
					content: `요청을 처리하지 못했습니다.\n\`신청 내역이 없습니다.: ${interactionMember.id}\``,
					ephemeral: true,
				});
				return;
			}

			// 기존 데이터 제거
			const index = groupData.participants.findIndex(
				(target) => target.memberId === interactionMember.id
			);
			groupData.participants.splice(index, 1);

			let expiresAt = dayjs().add(config.sessionDurationSeconds, 'seconds').unix();
			if (expiresAt > groupData.deadlineTimestamp) expiresAt = groupData.deadlineTimestamp;

			const sessionId =
				this._s4() +
				this._s4() +
				'-' +
				this._s4() +
				'-' +
				this._s4() +
				this._s4() +
				this._s4();

			const sessionData: ISession = {
				sessionId: sessionId,
				user: interactionMember.id,
				userName: `${interactionMember.user.username}(${interactionMember.nickname})`,
				group: groupId,
				sessionExpiresTimestamp: expiresAt,
				type: 'ISession',
			};

			if (DataManager.getInstance().isSessionExistWithUserId(interactionMember.id)) {
				DataManager.getInstance().deleteSessionDataWithUserId(interactionMember.id);
			}

			DataManager.getInstance().addSessionData(sessionData);

			const embed = new EmbedBuilder()
				.setTitle(`${groupData.name} 모임 신청 링크 안내`)
				.setDescription(
					`<@${interactionMember.id}>님의 모임 신청 링크는 아래와 같습니다.\n${config.express.serverAddressForUser}/form/?s=${sessionId}\n\n- **기존 신청 내역은 삭제되었습니다.**\n- 모임 신청 링크는 개인별로 지급됩니다. 모임 신청 링크를 타인과 공유하지 마세요.\n- 이전에 생성된 모임 신청 링크는 자동으로 만료됩니다.\n- 본 모임 신청 링크는 <t:${expiresAt}> (<t:${expiresAt}:R>)이 지나면 만료됩니다.\n- 만료 시간이 지나면 이미 접속 중이어도 제출이 불가능해집니다.`
				)
				.setColor(0xbbf1ff)
				.setFooter({ text: `모임 코드: ${groupData.groupId}` });

			interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});
		}
	}
}

export default ButtonsManager;
