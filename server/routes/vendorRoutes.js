import express from "express";
import {
  createVendorProduct,
  deleteVendorProduct,
  getVendorOrders,
  getVendorProducts,
  getVendorProfile,
  updateVendorDeliveryIssueStatus,
  updateVendorProduct,
  updateVendorProfile,
  updateVendorRiderBonus,
} from "../controllers/vendorController.js";
import {
  createVendorRider,
  exportVendorRiderEarningsCsv,
  getVendorRiderEarnings,
  getVendorRiders,
  resetVendorRiderPassword,
  updateVendorRiderOrderSettlement,
  updateVendorRiderStatus,
} from "../controllers/vendorRiderController.js";
import { exportVendorPayoutsCsv, getVendorPayouts } from "../controllers/vendorPayoutController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect, requireRole("vendor"));

router.get("/profile", getVendorProfile);
router.patch("/profile", updateVendorProfile);
router.get("/products", getVendorProducts);
router.post("/products", upload.single("image"), createVendorProduct);
router.put("/products/:id", upload.single("image"), updateVendorProduct);
router.delete("/products/:id", deleteVendorProduct);
router.get("/orders", getVendorOrders);
router.patch("/orders/:id/delivery-issue", updateVendorDeliveryIssueStatus);
router.patch("/orders/:id/rider-bonus", updateVendorRiderBonus);
router.get("/riders/earnings/export.csv", exportVendorRiderEarningsCsv);
router.get("/riders/earnings", getVendorRiderEarnings);
router.patch("/riders/earnings/orders/:orderId/settlement", updateVendorRiderOrderSettlement);
router.get("/riders", getVendorRiders);
router.post("/riders", createVendorRider);
router.patch("/riders/:id/status", updateVendorRiderStatus);
router.patch("/riders/:id/password", resetVendorRiderPassword);
router.get("/payouts/export.csv", exportVendorPayoutsCsv);
router.get("/payouts", getVendorPayouts);

export default router;
