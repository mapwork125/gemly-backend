import { Request } from "express";
import { asyncHandler } from "../../utils/asyncHandler.utility";
import { fail, success } from "../../utils/response.utility";
import service from "./requirement.service";

export const index = asyncHandler(async (req, res) =>
  success(res, "requirements", await service.index(req))
);
//@ts-ignore
export const get = asyncHandler(async (req, res) =>
  success(res, "requirement", (await service.get(req.params.id)) || {})
);
export const create = asyncHandler(async (req, res) =>
  success(res, "created", await service.create(req.body, req), 201)
);
//@ts-ignore
export const update = asyncHandler(async (req, res) =>
  success(res, "updated", (await service.update(req.params.id, req.body)) || {})
);
//@ts-ignore
export const remove = asyncHandler(async (req, res) => {
  const data = await service.remove(req.params.id);
  if (!data) {
    fail(res, "Requirement not found", 404);
  } else {
    success(res, "removed", data);
  }
});
