'use strict';

import express from 'express';

import ErrorCode from '../../template/express/ErrorCode';

class ExceptionHandler {
	public static UnhandledExceptionHandler = (
		err: Error,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		console.log(err);
		res.status(520).json(
			new ErrorCode(520, 'Unhandled Exception', '정의되지 않은 내부 오류입니다.')
		);
	};

	public static NotFoundExceptionHandler = (
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		res.status(404).json(new ErrorCode(404, 'Not Found', '올바르지 않은 접근입니다.'));
	};
}

export default ExceptionHandler;
