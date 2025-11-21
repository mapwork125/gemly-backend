import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import requirementRoutes from "../modules/requirement/requirement.routes";
import notificationRoutes from "../modules/notification/notification.routes";
import notificationSettingsRoutes from "../modules/notification-settings/notification-settings.routes";
import bidRoutes from "../modules/bid/bid.routes";
import dealRoutes from "../modules/deal/deal.routes";
import escrowRoutes from "../modules/escrow/escrow.routes";
import chatRoutes from "../modules/chat/chat.routes";
import inventoryRoutes from "../modules/inventory/inventory.routes";
import ratingRoutes from "../modules/rating/rating.routes";
import adsRoutes from "../modules/ads/ads.routes";
import adminRoutes from "../modules/admin/admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/requirements", requirementRoutes);
router.use("/notifications", notificationRoutes);
router.use("/notification-settings", notificationSettingsRoutes);
router.use("/bids", bidRoutes);
router.use("/deals", dealRoutes);
router.use("/escrow", escrowRoutes);
router.use("/chat", chatRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/ratings", ratingRoutes);
router.use("/ads", adsRoutes);
router.use("/admin", adminRoutes);

export default router;
