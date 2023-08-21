'use strict';

interface IData {
	groups?: Array<IGroup>;
	sessions?: Array<ISession>;
}

interface IGroup {
	groupId: string;
	holder: string;
	name: string;
	deadlineTimestamp: number;
	maxParticipants: number;
	menus?: Array<IMenu>;
	participants?: Array<IParticipants>;
}

interface IMenu {
	storeName: string;
	menus: Array<string>;
	prices: Array<number>;
}

interface IParticipants {
	memberId: string;
	menus: Array<string>;
}

interface ISession {
	sessionId: string;
	user: string;
	userName: string;
	group: string;
	sessionExpiresTimestamp: number;
}

export { IData, IGroup, IMenu, IParticipants, ISession };
