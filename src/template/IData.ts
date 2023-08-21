'use strict';

interface IData {
	activeGroups: Map<string, string>;
	groups?: Array<IGroup>;
	sessions?: Array<ISession>;
}

interface IGroup {
	groupId: string;
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
	memberId: Array<string>;
	menus: Array<string>;
}

interface ISession {
	sessionId: string;
	user: string;
	group: string;
	sessionExpiresTimestamp: number;
}

export { IData, IGroup, IMenu, IParticipants, ISession };
