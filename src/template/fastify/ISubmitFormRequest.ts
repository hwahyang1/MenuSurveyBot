import { FastifyRequest } from 'fastify';

interface ISubmitFormRequest extends FastifyRequest {
	body: {
		session?: string;
		menus?: Array<string>;
	};
}

export default ISubmitFormRequest;
