import { Router } from 'express';
import * as C from './chat.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate, validateParams } from '../../middlewares/validation.middleware';
import { initiateSchema, sendMessageSchema, conversationIdSchema } from './chat.validation';
const r = Router();

r.post('/initiate', authMiddleware, validate(initiateSchema), C.initiate);
r.post('/send-message', authMiddleware, validate(sendMessageSchema), C.sendMessage);
r.get('/:conversationId', authMiddleware, validateParams(conversationIdSchema), C.getMessages);
r.get('/', authMiddleware, C.listConversations);

export default r;
