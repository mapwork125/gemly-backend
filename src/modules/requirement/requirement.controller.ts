import { Request } from "express";
import { asyncHandler } from "../../utils/asyncHandler.utility";
import { fail, success } from "../../utils/response.utility";
import service from "./requirement.service";
import { MODULES, RESPONSE_MESSAGES } from "../../utils/constants.utility";

export const index = asyncHandler(async (req, res) =>
  success(
    res,
    RESPONSE_MESSAGES.get(MODULES.REQUIREMENT),
    await service.index(req)
  )
);
//@ts-ignore
export const get = asyncHandler(async (req, res) => {
  const userId = req.user?._id?.toString();
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];

  const data = await service.get(req.params.id, userId, ipAddress, userAgent);

  success(res, RESPONSE_MESSAGES.get(MODULES.REQUIREMENT), data);
});
export const create = asyncHandler(async (req, res) =>
  success(
    res,
    RESPONSE_MESSAGES.created(MODULES.REQUIREMENT),
    await service.create(req.body, req),
    201
  )
);
//@ts-ignore
export const update = asyncHandler(async (req, res) => {
  const data = await service.update(req.params.id, req.body, req.user.id);
  if (!data) {
    fail(res, RESPONSE_MESSAGES.notFound(MODULES.REQUIREMENT), 404);
  } else {
    success(res, RESPONSE_MESSAGES.updated(MODULES.REQUIREMENT), data);
  }
});
//@ts-ignore
export const remove = asyncHandler(async (req, res) => {
  const data = await service.remove(req.params.id, req.user.id);
  if (!data) {
    fail(res, RESPONSE_MESSAGES.notFound(MODULES.REQUIREMENT), 404);
  } else {
    success(res, RESPONSE_MESSAGES.deleted(MODULES.REQUIREMENT), data);
  }
});

//@ts-ignore
export const close = asyncHandler(async (req, res) => {
  const data = await service.close(req.params.id, req.user.id);
  if (!data) {
    fail(res, RESPONSE_MESSAGES.notFound(MODULES.REQUIREMENT), 404);
  } else {
    success(res, "Requirement closed successfully", data);
  }
});
