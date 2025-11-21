import { Router } from 'express';
import * as C from './notification.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateParams } from '../../middlewares/validation.middleware';
import { notificationIdSchema } from './notification.validation';
const r = Router();

r.get('/', authMiddleware, C.index);
r.put('/read/:id', authMiddleware, validateParams(notificationIdSchema), C.markRead);
r.delete('/:id', authMiddleware, validateParams(notificationIdSchema), C.remove);

export default r;
