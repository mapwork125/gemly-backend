export const success = (
  res,
  message = "Success",
  data: any = {},
  code = 200,
  status = "",
  obj: any = {}
) =>
  res.status(code).json({
    success: true,
    message,
    ...(data ? { data: data } : {}),
    ...(status ? { status: status } : {}),
    ...obj,
  });

export const fail = (
  res,
  message = "Failure",
  code = 400,
  data = {},
  status = "",
  obj: any = {}
) =>
  res.status(code).json({
    success: false,
    message,
    errors: data,
    ...(status ? { status: status } : {}),
    ...obj,
  });
