const express = require("express");
const { getAnalystDashboardSummary } = require("../controllers/analyst_dashboardController");
const { getUserDashboardSummary } = require("../controllers/user_dashboardController");
const { authenticate, requireAnalyst, requireUser } = require("../middleware/auth");

const router = express.Router();

router.get("/analyst/summary", authenticate, requireAnalyst, getAnalystDashboardSummary);
router.get("/me/summary", authenticate, requireUser, getUserDashboardSummary);

module.exports = router;
