'use strict';

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

import StatusCode from '../../template/fastify/StatusCode';

class ExceptionHandler {
	public static UnhandledExceptionHandler = (
		error: FastifyError,
		request: FastifyRequest,
		reply: FastifyReply
	) => {
		console.log(error);
		reply
			.status(520)
			.send(new StatusCode(520, 'Unhandled Exception', '정의되지 않은 내부 오류입니다.'));
	};

	public static NotFoundExceptionHandler = (request: FastifyRequest, reply: FastifyReply) => {
		reply.status(404).send(new StatusCode(404, 'Not Found', '올바르지 않은 접근입니다.'));
	};
}

export default ExceptionHandler;
