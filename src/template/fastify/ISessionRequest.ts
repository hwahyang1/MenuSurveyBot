import { FastifyRequest } from 'fastify';

interface ISessionRequest extends FastifyRequest {
    query: {
        session?:string;
    }
}

export default ISessionRequest;