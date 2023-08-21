'use strict';

import { ButtonInteraction, GuildMember } from 'discord.js';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import DataManager from '../dataManager';

import { IData, IGroup, IMenu, IParticipants, ISession } from '../../template/IData';

class ButtonsManager {
	constructor() {
		dayjs.extend(customParseFormat);
		dayjs.extend(utc);
		dayjs.extend(timezone);
		dayjs.tz.setDefault('Asia/Seoul');
	}

	public async processButton(
		interaction: ButtonInteraction,
		interactionMemeber: GuildMember,
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
		} else if (interaction.customId.startsWith('statusGroup_')) {
			groupId = interaction.customId.replace('statusGroup_', '');

			if (!DataManager.getInstance().isGroupExist(groupId)) {
				await interaction.reply({
					content: `요청을 처리하지 못했습니다.\n\`유효하지 않은 모임코드 입니다: ${groupId}\``,
					ephemeral: true,
				});
				return;
			}
		}
	}
}

export default ButtonsManager;
