import { Router } from 'express';
import * as C from './bid.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate, validateParams } from '../../middlewares/validation.middleware';
import { bidSchema, requirementIdSchema } from './bid.validation';
const r = Router();
r.post('/:requirementId', authMiddleware, validateParams(requirementIdSchema), validate(bidSchema), C.placeBid);
r.get('/:requirementId', authMiddleware, validateParams(requirementIdSchema), C.getBids);
export default r;
