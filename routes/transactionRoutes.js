const express = require("express");
const {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/admin_transactionController");
const { getAllRecords, getFilteredRecordsAnalyst } = require("../controllers/analyst_transactionController");
const { getFilteredRecordsForUser, getRecordsByUserId } = require("../controllers/user_transactionController");
const { authenticate, requireAdmin, requireAnalyst, requireUser } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, requireAnalyst, getAllRecords);
router.get("/filter", authenticate, requireAnalyst, getFilteredRecordsAnalyst);
router.get("/me/filter", authenticate, requireUser, getFilteredRecordsForUser);
router.get("/user/:userId", authenticate, requireUser, getRecordsByUserId);

router.post("/", authenticate, requireAdmin, createTransaction);
router.patch("/:id", authenticate, requireAdmin, updateTransaction);
router.delete("/:id", authenticate, requireAdmin, deleteTransaction);

module.exports = router;
