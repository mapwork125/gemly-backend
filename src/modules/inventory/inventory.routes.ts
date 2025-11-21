import { Router } from 'express';
import * as C from './inventory.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate, validateParams } from '../../middlewares/validation.middleware';
import { inventorySchema, updateInventorySchema, inventoryIdSchema } from './inventory.validation';
const r = Router();

r.post('/', authMiddleware, validate(inventorySchema), C.create);
r.get('/', authMiddleware, C.index);
r.put('/:id', authMiddleware, validateParams(inventoryIdSchema), validate(updateInventorySchema), C.update);
r.delete('/:id', authMiddleware, validateParams(inventoryIdSchema), C.remove);

export default r;
