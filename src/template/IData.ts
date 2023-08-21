'use strict';

interface IData {
	activeGroups: Map<string, string>;
	groups?: Map<string, IGroup>;
	sessions?: Map<string, ISession>;
}

interface IGroup {
	deadlineTimestamp: number;
	maxParticipants: number;
	menus?: Map<string, Map<string, number>>;
	participants?: Map<string, Map<string, Array<string>>>;
}

interface ISession {
	user: string;
	group: string;
	sessionExpiresTimestamp: number;
}

export { IData, IGroup, ISession };
