import express from "express";
import { verifyToken, adminMiddleware } from "../middleware/authMiddleware.js";
import {
  getAuditLogs,
  getMessagingSettings,
  retryNotificationDelivery,
  sendMessagingTest,
  sendNotification,
  updateMessagingSettings,
} from "../controllers/adminController.js";
import {
  createVendorPayoutRecord,
  exportAdminVendorPayoutsCsv,
  getAdminVendorPayouts,
  updateVendorPayoutRecord,
} from "../controllers/vendorPayoutController.js";

const router = express.Router();

router.get("/audit", verifyToken, adminMiddleware, getAuditLogs);
router.post("/notifications/send", verifyToken, adminMiddleware, sendNotification);
router.get("/messaging-settings", verifyToken, adminMiddleware, getMessagingSettings);
router.patch("/messaging-settings", verifyToken, adminMiddleware, updateMessagingSettings);
router.post("/messaging-settings/test", verifyToken, adminMiddleware, sendMessagingTest);
router.post("/notifications/:id/retry-external", verifyToken, adminMiddleware, retryNotificationDelivery);
router.get("/vendor-payouts/export.csv", verifyToken, adminMiddleware, exportAdminVendorPayoutsCsv);
router.get("/vendor-payouts", verifyToken, adminMiddleware, getAdminVendorPayouts);
router.post("/vendor-payouts", verifyToken, adminMiddleware, createVendorPayoutRecord);
router.put("/vendor-payouts/:id", verifyToken, adminMiddleware, updateVendorPayoutRecord);

export default router;
