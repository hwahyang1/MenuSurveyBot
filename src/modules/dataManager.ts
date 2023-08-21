'use strict';

import fs from 'fs';

import { IData, IGroup, IMenu, IParticipants, ISession } from '../template/IData';

class DataManager {
	private static instance: DataManager;

	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private readonly dataPath = 'data/data.json';
	private data: IData;

	constructor() {
		this.reloadData();
	}

	public async reloadData() {
		if (!(await fs.existsSync(this.dataPath))) {
			throw "'/data/data.json' does not exist. Use '/data/data.json.SAMPLE'.";
		}
		let rawData = JSON.parse(await fs.readFileSync(this.dataPath, 'utf-8'));
		this.data = rawData as IData;
	}

	public getAllData = (): IData => this.data;

	/* ==================== ActivateGroups ==================== */
	public getActiveGroupsData = (): Map<string, string> => this.data.activeGroups;
	public getActiveGroupData(channelId: string): string | null {
		if (!this.data || !this.data.activeGroups) return null;
		if (!this.data.activeGroups.has(channelId)) return null;
		return this.data.activeGroups?.get(channelId);
	}
	public addActiveGroupData(channelId: string, groupId: string) {
		if (!this.data || !this.data.activeGroups) return;
		if (this.data.activeGroups.has(channelId)) return;
		this.data.activeGroups.set(channelId, groupId);
		this.saveData();
	}
	public deleteActiveGroupData(channelId: string) {
		if (!this.data || !this.data.activeGroups) return;
		if (!this.data.activeGroups.has(channelId)) return;
		this.data.activeGroups.delete(channelId);
		this.saveData();
	}

	/* ==================== Groups ==================== */
	public isGroupExist(groupId: string): boolean {
		if (
			this.data.groups === undefined ||
			this.data.groups === null ||
			this.data.groups.length === undefined ||
			this.data.groups.length === 0
		)
			return false;
		const index = this.data.groups.findIndex((target) => target.groupId === groupId);
		return index >= 0;
	}

	public isGroupActivate(groupId: string): boolean {
		if (!this.data || !this.data.activeGroups) return false;
		if (!this.isGroupExist(groupId)) return false;
		for (const [key, value] of this.data.activeGroups.entries()) {
			if (value === groupId) {
				return true;
			}
		}
		return false;
	}
	public findGroupActivate(groupId: string): string | null {
		if (!this.data || !this.data.activeGroups) return null;
		if (!this.isGroupExist(groupId)) return null;
		for (const [key, value] of this.data.activeGroups.entries()) {
			if (value === groupId) {
				// channelId
				return key;
			}
		}
		return null;
	}

	public getGroupsData = (): Array<IGroup> | null => this.data.groups;
	public getGroupData(groupId: string): IGroup | null {
		if (!this.data || !this.data.groups) return null;
		if (!this.isGroupExist(groupId)) return null;
		return this.data.groups.find((target) => target.groupId == groupId);
	}
	public addGroupData(data: IGroup) {
		if (!this.data || !this.data.groups) return;
		if (this.isGroupExist(data.groupId)) return;
		if (this.data.groups.length === undefined) this.data.groups = new Array<IGroup>();
		this.data.groups.push(data);
		this.saveData();
	}
	public deleteGroupData(groupId: string) {
		if (!this.data || !this.data.groups) return;
		if (!this.isGroupExist(groupId)) return;
		this.data.groups.splice(this.data.groups.indexOf(this.getGroupData(groupId)), 1);
		this.saveData();
	}

	/* ==================== Sessions ==================== */
	public isSessionExist(sessionId: string): boolean {
		if (
			this.data.sessions === undefined ||
			this.data.sessions === null ||
			this.data.sessions.length === undefined ||
			this.data.sessions.length === 0
		)
			return false;
		this.data.sessions.forEach((target) => {
			if (target.sessionId === sessionId) return true;
		});
		return false;
	}

	public getSessionsData = (): Array<ISession> | null => this.data.sessions;
	public getSessionData(sessionId: string): ISession | null {
		if (!this.data || !this.data.sessions) return null;
		if (!this.isSessionExist(sessionId)) return null;
		return this.data.sessions.find((target) => target.sessionId == sessionId);
	}
	public addSessionData(data: ISession) {
		if (!this.data || !this.data.sessions) return;
		if (this.isSessionExist(data.sessionId)) return;
		if (this.data.sessions.length === undefined) this.data.sessions = new Array<ISession>();
		this.data.sessions.push(data);
		this.saveData();
	}
	public deleteSessionData(sessionId: string) {
		if (!this.data || !this.data.sessions) return;
		if (!this.isSessionExist(sessionId)) return;
		this.data.sessions.splice(this.data.sessions.indexOf(this.getSessionData(sessionId)), 1);
		this.saveData();
	}

	public async saveData() {
		let rawData = JSON.stringify(this.data, null, 4);
		fs.writeFileSync(this.dataPath, rawData, 'utf-8');
	}
}

export default DataManager;
