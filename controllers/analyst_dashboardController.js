const { buildMatchFromOptions, getDashboardSummary } = require("../utils/dashboardSummary");

/**
 * GET /api/dashboard/analyst/summary
 * Optional query: userId (one user), from, to (date range on transaction date)
 */
async function getAnalystDashboardSummary(req, res) {
  // Controller-level guard: both analyst and admin can access this summary.
  if (!req.user || !["analyst", "admin"].includes(req.user.role)) {
    return res.status(403).json({ ok: false, message: "You do not have permission to access this resource" });
  }

  const { userId, from, to } = req.query;
  const built = buildMatchFromOptions({ userId, from, to });
  if (built.error) {
    return res.status(400).json({ ok: false, message: built.error });
  }

  try {
    const summary = await getDashboardSummary(built.match);
    return res.json({
      ok: true,
      scope: userId ? "single_user" : "all_users",
      summary,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Something went wrong" });
  }
}

module.exports = {
  getAnalystDashboardSummary,
};
