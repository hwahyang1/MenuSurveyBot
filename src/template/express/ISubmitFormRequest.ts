import express from 'express';

interface ISubmitFormRequest extends express.Request {
	body: {
		session?: string;
        menus?: Array<string>;
	};
}

export default ISubmitFormRequest;
