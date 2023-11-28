'use strict';

import { FastifyRequest, FastifyReply } from 'fastify';

import DataManager from '../dataManager';

import { IParticipants } from '../../template/IData';
import StatusCode from '../../template/fastify/StatusCode';
import ISessionRequest from '../../template/fastify/ISessionRequest';
import ISessionResponse from '../../template/fastify/ISessionResponse';
import ISubmitFormRequest from '../../template/fastify/ISubmitFormRequest';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

const config = require('../../../config/config.json');

class ExpressEventHandler {
	constructor() {
		dayjs.extend(customParseFormat);
		dayjs.extend(utc);
		dayjs.extend(timezone);
		dayjs.tz.setDefault('Asia/Seoul');
	}

	public getSessionInfo(request: ISessionRequest, reply: FastifyReply) {
		const session = DataManager.getInstance().getSessionData(request.query.session ?? '');

		const currentTimestamp = dayjs().unix();

		if (session === null || session.sessionExpiresTimestamp < currentTimestamp) {
			reply
				.status(401)
				.send(
					new StatusCode(
						401,
						'Invalid Session',
						'만료되었거나 유효하지 않은 세션입니다. (또는 모임 마감시간이 지났습니다.) 링크를 다시 생성 해 주세요.'
					)
				);
		} else {
			const group = DataManager.getInstance().getGroupData(session.group);

			const response: ISessionResponse = {
				code: 200,
				session: session,
				group: group,
				bankAccount: config.bankAccount,
				type: 'ISessionResponse',
			};
			reply.send(response);
		}
	}

	public postSubmitForm(request: ISubmitFormRequest, reply: FastifyReply) {
		const session = DataManager.getInstance().getSessionData(request.body.session ?? '');

		const currentTimestamp = dayjs().unix();

		if (session === null || session.sessionExpiresTimestamp < currentTimestamp) {
			reply
				.status(401)
				.send(
					new StatusCode(
						401,
						'Invalid Session',
						'만료되었거나 유효하지 않은 세션입니다. (또는 모임 마감시간이 지났습니다.) 링크를 다시 생성 해 주세요.'
					)
				);
		} else {
			const participantsData: IParticipants = {
				memberId: session.user,
				menus:
					typeof request.body['menus[]'] === 'string'
						? [request.body['menus[]']]
						: request.body['menus[]'], // TODO
				type: 'IParticipants',
			};

			let groupData = DataManager.getInstance().getGroupData(session.group);

			if (
				groupData.participants === undefined ||
				groupData.participants === null ||
				groupData.participants.length === undefined ||
				groupData.participants.length === 0
			) {
				groupData.participants = new Array<IParticipants>();
			}
			groupData.participants.push(participantsData);

			DataManager.getInstance().deleteSessionData(session.sessionId);
			DataManager.getInstance().deleteGroupData(session.group);
			DataManager.getInstance().addGroupData(groupData);

			reply.send(new StatusCode(200, 'Success', '제출되었습니다.'));
		}
	}
}

export default ExpressEventHandler;
