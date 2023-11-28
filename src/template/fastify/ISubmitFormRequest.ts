import { FastifyRequest } from 'fastify';

interface ISubmitFormRequest extends FastifyRequest {
	body: {
		session?: string;
		'menus[]'?: Array<string>; //TODO
	};
}

export default ISubmitFormRequest;
