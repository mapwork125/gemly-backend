import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";
import { fail } from "../utils/response.utility";

export const validate =
  (schema: ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return fail(res, error.details[0].message, 400, {});
    }
    next();
  };

export const validateParams =
  (schema: ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params);
    if (error) {
      return fail(res, error.details[0].message, 400, {});
    }
    next();
  };
