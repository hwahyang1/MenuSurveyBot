'use strict';

class MapTools {
	public static objToMap<V>(obj: Record<string, V>): Map<string, V> {
		const map = new Map<string, V>();
		for (const key in obj) {
			map.set(key, obj[key]);
		}
		return map;
	}
    
	public static mapToObj<K, V>(map: Map<K, V>): Record<string, V> {
		const obj: Record<string, V> = {};
		map.forEach((value, key) => {
			obj[key as unknown as string] = value;
		});
		return obj;
	}
}

export default MapTools;
