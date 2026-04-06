const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const { buildFilterFromQuery, fetchFilteredTransactions } = require("../utils/transactionFilter");

function invalidId(res) {
  return res.status(400).json({ ok: false, message: "Invalid id" });
}

async function getFilteredRecordsForUser(req, res) {
  const built = buildFilterFromQuery(req.query, { restrictUserId: req.user.id });
  if (built.error) {
    return res.status(built.error.status).json({ ok: false, message: built.error.message });
  }
  try {
    const records = await fetchFilteredTransactions(built.filter);
    return res.json({ ok: true, count: records.length, records });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Something went wrong" });
  }
}

async function getRecordsByUserId(req, res) {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) {
    return invalidId(res);
  }

  if (userId !== req.user.id) {
    return res.status(403).json({ ok: false, message: "You can only access your own records" });
  }

  try {
    const records = await Transaction.find({ userId }).sort({ date: -1, createdAt: -1 }).lean();
    return res.json({ ok: true, count: records.length, records });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Something went wrong" });
  }
}

module.exports = {
  getFilteredRecordsForUser,
  getRecordsByUserId,
};
