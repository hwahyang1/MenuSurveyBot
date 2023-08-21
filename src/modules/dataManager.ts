'use strict';

import fs from 'fs';

import { IData, IGroup, ISession } from '../template/IData';
import MapTools from '../template/mapTools';

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

		const activeGroups = MapTools.objToMap(rawData.activeGroups);
		const groups = MapTools.objToMap(rawData.groups);
		const sessions = MapTools.objToMap(rawData.sessions);

		this.data = { activeGroups, groups, sessions } as IData;
	}

	public getAllData = (): IData => this.data;

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

	public getGroupsData = (): Map<string, IGroup> | null => this.data.groups;
	public getGroupData(groupId: string): IGroup | null {
		if (!this.data || !this.data.groups) return null;
		if (!this.data.groups.has(groupId)) return null;
		return this.data.groups?.get(groupId);
	}
	public addGroupData(groupId: string, data: IGroup) {
		if (!this.data || !this.data.groups) return;
		if (this.data.groups.has(groupId)) return;
		this.data.groups.set(groupId, data);
		this.saveData();
	}
	public deleteGroupData(groupId: string) {
		if (!this.data || !this.data.groups) return;
		if (!this.data.groups.has(groupId)) return;
		this.data.groups.delete(groupId);
		this.saveData();
	}

	public getSessionsData = (): Map<string, ISession> | null => this.data.sessions;
	public getSessionData(sessionId: string): ISession | null {
		if (!this.data || !this.data.sessions) return null;
		if (!this.data.sessions.has(sessionId)) return null;
		return this.data.sessions?.get(sessionId);
	}
	public addSessionData(sessionId: string, data: ISession) {
		if (!this.data || !this.data.sessions) return;
		if (this.data.sessions.has(sessionId)) return;
		this.data.sessions.set(sessionId, data);
		this.saveData();
	}
	public deleteSessionData(sessionId: string) {
		if (!this.data || !this.data.sessions) return;
		if (!this.data.sessions.has(sessionId)) return;
		this.data.sessions.delete(sessionId);
		this.saveData();
	}

	public async saveData() {
		const convertedData = {
			//...this.data,
			activeGroups: MapTools.mapToObj(this.data.activeGroups),
			groups: MapTools.mapToObj(this.data.groups || new Map()),
			sessions: MapTools.mapToObj(this.data.sessions || new Map()),
		};

		let rawData = JSON.stringify(convertedData, null, 4);
		fs.writeFileSync(this.dataPath, rawData, 'utf-8');
	}
}

export default DataManager;
