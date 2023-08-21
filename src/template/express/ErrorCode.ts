'use strict';

class ErrorCode {
	public code: number;
	public description: string;
	public userDescription: string;

	constructor(code: number, description: string, userDescription: string) {
		this.code = code;
		this.description = description;
		this.userDescription = userDescription;
	}
}

export default ErrorCode;
