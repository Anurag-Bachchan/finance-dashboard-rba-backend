const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

const RECENT_LIMIT = 10;

/**
 * @param {{ userId?: string, from?: string, to?: string }} options
 * @returns {{ match: object } | { error: string }}
 */
function buildMatchFromOptions(options) {
  const { userId, from, to } = options || {};
  const match = {};

  if (userId != null && String(userId).trim() !== "") {
    if (!mongoose.isValidObjectId(userId)) {
      return { error: "Invalid userId" };
    }
    match.userId = new mongoose.Types.ObjectId(userId);
  }

  if ((from != null && String(from).trim() !== "") || (to != null && String(to).trim() !== "")) {
    match.date = {};
    if (from != null && String(from).trim() !== "") {
      match.date.$gte = new Date(from);
    }
    if (to != null && String(to).trim() !== "") {
      const end = new Date(to);
      end.setUTCHours(23, 59, 59, 999);
      match.date.$lte = end;
    }
  }

  return { match };
}

/**
 * @param {object} match - Mongo filter for Transaction
 */
async function getDashboardSummary(match) {
  const [totalsRow] = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
        expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
      },
    },
  ]);

  const totalIncome = totalsRow?.income || 0;
  const totalExpenses = totalsRow?.expense || 0;

  const byCategoryRaw = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$category",
        income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
        expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byCategory = byCategoryRaw.map((row) => ({
    category: row._id,
    income: row.income,
    expense: row.expense,
    net: row.income - row.expense,
  }));

  const monthlyRaw = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
        expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const monthlyTrends = monthlyRaw.map((row) => ({
    year: row._id.year,
    month: row._id.month,
    period: `${row._id.year}-${String(row._id.month).padStart(2, "0")}`,
    income: row.income,
    expense: row.expense,
    net: row.income - row.expense,
  }));

  const weeklyRaw = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          isoWeekYear: { $isoWeekYear: "$date" },
          isoWeek: { $isoWeek: "$date" },
        },
        income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
        expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
      },
    },
    { $sort: { "_id.isoWeekYear": 1, "_id.isoWeek": 1 } },
  ]);

  const weeklyTrends = weeklyRaw.map((row) => ({
    isoWeekYear: row._id.isoWeekYear,
    isoWeek: row._id.isoWeek,
    period: `${row._id.isoWeekYear}-W${String(row._id.isoWeek).padStart(2, "0")}`,
    income: row.income,
    expense: row.expense,
    net: row.income - row.expense,
  }));

  const recentActivity = await Transaction.find(match)
    .sort({ date: -1, createdAt: -1 })
    .limit(RECENT_LIMIT)
    .populate("userId", "name email")
    .lean();

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    byCategory,
    monthlyTrends,
    weeklyTrends,
    recentActivity,
  };
}

module.exports = {
  buildMatchFromOptions,
  getDashboardSummary,
  RECENT_LIMIT,
};
