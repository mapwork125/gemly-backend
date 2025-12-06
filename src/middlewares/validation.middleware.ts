import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";
import { fail } from "../utils/response.utility";
import { RESPONSE_MESSAGES } from "../utils/constants.utility";

export const validate =
  (schema: ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req.method === "GET" ? req.query : req.body; // Use query for GET, body for others
    const { error } = schema.validate(dataToValidate);
    if (error) {
      const errorDetail = {};
      error.details.forEach((val) => {
        let key = val.path.join(".");
        let message = val.message;
        errorDetail[key] = message;
      });

      return fail(
        res,
        RESPONSE_MESSAGES.MISSING_REQUIRED_FIELDS,
        400,
        errorDetail
      );
    }
    next();
  };

export const validateParams =
  (schema: ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params);
    if (error) {
      const errorDetail = {};
      error.details.forEach((val) => {
        let key = val.path.join(".");
        let message = val.message;
        errorDetail[key] = message;
      });

      return fail(
        res,
        RESPONSE_MESSAGES.MISSING_REQUIRED_PARAMS,
        400,
        errorDetail
      );
    }
    next();
  };

export const validateQuery =
  (schema: ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query);
    if (error) {
      const errorDetail = {};
      error.details.forEach((val) => {
        let key = val.path.join(".");
        let message = val.message;
        errorDetail[key] = message;
      });

      return fail(res, "Invalid query parameters", 400, errorDetail);
    }
    next();
  };
