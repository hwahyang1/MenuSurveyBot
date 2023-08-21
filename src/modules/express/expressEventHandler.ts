'use strict';

import express from 'express';

import DataManager from '../dataManager';

import ErrorCode from '../../template/express/ErrorCode';
import ISessionRequest from '../../template/express/ISessionRequest';
import ISessionResponse from '../../template/express/ISessionResponse';
import ISubmitFormRequest from '../../template/express/ISubmitFormRequest';

const config = require('../../../config/config.json');

class ExpressEventHandler {
	public getSessionInfo(req: ISessionRequest, res: express.Response) {
		const session = DataManager.getInstance().getSessionData(req.query.session ?? '');

		if (session === null) {
			res.status(401).json(
				new ErrorCode(
					401,
					'Invalid Session',
					'만료되었거나 유효하지 않은 세션입니다. 링크를 다시 생성 해 주세요.'
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
			res.json(response);
		}
	}

	public postSubmitForm(req: ISubmitFormRequest, res: express.Response) {
		const session = DataManager.getInstance().getSessionData(req.body.session ?? '');

		if (session === null) {
			res.status(401).json(
				new ErrorCode(
					401,
					'Invalid Session',
					'만료되었거나 유효하지 않은 세션입니다. 링크를 다시 생성 해 주세요.'
				)
			);
		} else {
			console.log(req.body); // { session: 'asdf', menus: [ '테스트가게|테스트메뉴' ] }
			//DataManager.getInstance().deleteSessionData(session.sessionId);
			res.json(new ErrorCode(200, 'Success', '제출되었습니다.'));
		}
	}
}

export default ExpressEventHandler;
