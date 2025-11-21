import { Router } from 'express';
import * as C from './notification-settings.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { notificationSettingsSchema } from './notification-settings.validation';
const r = Router();
r.get('/', authMiddleware, C.get);
r.put('/', authMiddleware, validate(notificationSettingsSchema), C.update);
export default r;
