import express from 'express';

interface ISessionRequest extends express.Request {
    query: {
        session?:string;
    }
}

export default ISessionRequest;