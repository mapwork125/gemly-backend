import { asyncHandler } from "../../utils/asyncHandler.utility";
import {
  RESPONSE_MESSAGES,
  USER_ROLE,
  USER_STATUS,
} from "../../utils/constants.utility";
import { success, fail } from "../../utils/response.utility";
import authService from "./auth.service";

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);

  return success(
    res,
    RESPONSE_MESSAGES.REGISTER_SUCCESS,
    { ...user },
    200,
    USER_STATUS.PENDING_KYC
  );
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  const status = user.status;
  const message =
    user.status === USER_STATUS.APPROVED || user.role === USER_ROLE.ADMIN
      ? RESPONSE_MESSAGES.LOGIN_SUCCESS
      : RESPONSE_MESSAGES[user.status] || RESPONSE_MESSAGES.PENDING_KYC;
  return success(res, message, {}, 200, status, { token,_id:user._id });
});

export const verifyIdentity = asyncHandler(async (req, res) => {
  // Check if a file was uploaded
  if (!req.file) {
    return fail(res, RESPONSE_MESSAGES.NO_DOC_UPLOADED, 400);
  }

  // Construct the document link (req.file.path is set by saveFile middleware)
  const documentLink = req.file.path;

  const body = {
    ...req.body,
    documents: {
      aadharDocument: "",
      panDocument: "",
    },
  };

  if (body.identityProof.proofType === "Aadhar") {
    body.documents.aadharDocument = documentLink;
  } else {
    body.documents.panDocument = documentLink;
  }
  // Call the service to verify identity and update the user
  const data: any = await authService.verifyIdentity(req.user._id, body);
  console.log(data);
  return success(
    res,
    RESPONSE_MESSAGES.PENDING_ADMIN_APPROVAL,
    {},
    200,
    data?.status
  );
});

export const getProfile = asyncHandler(async (req, res) => {
  
  let user_req_bids_data = await authService.req_bids_dataservice(req.user._id);
  return success(res, RESPONSE_MESSAGES.PROFILE_RETRIEVED, {user: req.user, requirements: user_req_bids_data.requirements.length == 0 ? [] : user_req_bids_data.requirements, bids: user_req_bids_data.bids.length == 0 ? [] : user_req_bids_data.bids});
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updated: any = await authService.updateProfile(req.user._id, req.body);
  return success(res, RESPONSE_MESSAGES.PROFILE_UPDATED, updated);
});

export const logout = asyncHandler(async (req, res) => {
  // token invalidation can be handled via blacklist or short expiry
  await authService.logout(req.user._id);
  return success(res, RESPONSE_MESSAGES.LOGGED_OUT, {});
});
