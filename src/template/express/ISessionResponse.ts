'use strict';

import { IData, IGroup, IMenu, IParticipants, ISession } from '../IData';

interface ISessionResponse {
	code: number;
	session: ISession;
	group: IGroup;
	bankAccount: string;
	type: 'ISessionResponse';
}

export default ISessionResponse;
