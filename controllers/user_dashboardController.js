const { buildMatchFromOptions, getDashboardSummary } = require("../utils/dashboardSummary");

/**
 * GET /api/dashboard/me/summary
 * Authenticated user only — data limited to req.user.id.
 * Optional query: from, to (date range on transaction date)
 */
async function getUserDashboardSummary(req, res) {
  const { from, to } = req.query;
  const built = buildMatchFromOptions({ userId: req.user.id, from, to });
  if (built.error) {
    return res.status(400).json({ ok: false, message: built.error });
  }

  try {
    const summary = await getDashboardSummary(built.match);
    return res.json({
      ok: true,
      scope: "self",
      userId: req.user.id,
      summary,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Something went wrong" });
  }
}

module.exports = {
  getUserDashboardSummary,
};
