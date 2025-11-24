import { verifyToken } from "../utils/jwt.utility";
import User from "../models/User.model";

export const authMiddleware = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth)
      return res.status(401).json({ status: false, message: "No token" });
    const token = auth.split(" ")[1];
    const decoded: any = verifyToken(token);
    console.log(decoded);

    const user = await User.findById(decoded.id);
    if (!user || user?.tokenVersion !== decoded?.tokenVersion)
      return res.status(401).json({ status: false, message: "Invalid token" });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
