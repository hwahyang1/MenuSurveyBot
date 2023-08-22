'use strict';

interface IData {
	groups?: Array<IGroup>;
	sessions?: Array<ISession>;
	type: 'IData';
}

interface IGroup {
	groupId: string;
	holder: string;
	name: string;
	deadlineTimestamp: number;
	maxParticipants: number;
	menus?: Array<IMenu>;
	participants?: Array<IParticipants>;
	type: 'IGroup';
}

interface IMenu {
	storeName: string;
	menus: Array<string>;
	prices: Array<number>;
	type: 'IMenu';
}

interface IParticipants {
	memberId: string;
	menus: Array<string>;
	type: 'IParticipants';
}

interface ISession {
	sessionId: string;
	user: string;
	userName: string;
	group: string;
	sessionExpiresTimestamp: number;
	type: 'ISession';
}

export { IData, IGroup, IMenu, IParticipants, ISession };
