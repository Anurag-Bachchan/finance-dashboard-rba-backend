const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const { TYPES, CATEGORIES } = Transaction;

/**
 * Query: type, category, date (single calendar day), dateFrom, dateTo (range), userId (analyst only).
 * When restrictUserId is set, userId from query is ignored.
 */
function buildFilterFromQuery(query, options = {}) {
  const filter = {};
  const { restrictUserId } = options;

  if (restrictUserId) {
    if (!mongoose.isValidObjectId(restrictUserId)) {
      return { error: { status: 400, message: "Invalid user id" } };
    }
    filter.userId = restrictUserId;
  } else if (query.userId != null && String(query.userId).trim() !== "") {
    if (!mongoose.isValidObjectId(query.userId)) {
      return { error: { status: 400, message: "Invalid userId" } };
    }
    filter.userId = query.userId;
  }

  if (query.type != null && String(query.type).trim() !== "") {
    if (!TYPES.includes(query.type)) {
      return { error: { status: 400, message: `type must be one of: ${TYPES.join(", ")}` } };
    }
    filter.type = query.type;
  }

  if (query.category != null && String(query.category).trim() !== "") {
    if (!CATEGORIES.includes(query.category)) {
      return { error: { status: 400, message: `category must be one of: ${CATEGORIES.join(", ")}` } };
    }
    filter.category = query.category;
  }

  const hasRange = Boolean(query.dateFrom || query.dateTo);
  const hasSingle = query.date != null && String(query.date).trim() !== "";

  if (hasRange && hasSingle) {
    return { error: { status: 400, message: "Use either date or dateFrom/dateTo, not both" } };
  }

  if (hasSingle) {
    const start = new Date(query.date);
    if (Number.isNaN(start.getTime())) {
      return { error: { status: 400, message: "Invalid date" } };
    }
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    filter.date = { $gte: start, $lt: end };
  } else if (hasRange) {
    filter.date = {};
    if (query.dateFrom != null && String(query.dateFrom).trim() !== "") {
      const from = new Date(query.dateFrom);
      if (Number.isNaN(from.getTime())) {
        return { error: { status: 400, message: "Invalid dateFrom" } };
      }
      from.setUTCHours(0, 0, 0, 0);
      filter.date.$gte = from;
    }
    if (query.dateTo != null && String(query.dateTo).trim() !== "") {
      const to = new Date(query.dateTo);
      if (Number.isNaN(to.getTime())) {
        return { error: { status: 400, message: "Invalid dateTo" } };
      }
      to.setUTCHours(23, 59, 59, 999);
      filter.date.$lte = to;
    }
    if (Object.keys(filter.date).length === 0) {
      delete filter.date;
    }
  }

  return { filter };
}

async function fetchFilteredTransactions(filter) {
  return Transaction.find(filter).sort({ date: -1, createdAt: -1 }).lean();
}

module.exports = {
  buildFilterFromQuery,
  fetchFilteredTransactions,
};
