const Transaction = require("../models/Transaction");
const { buildFilterFromQuery, fetchFilteredTransactions } = require("../utils/transactionFilter");

async function getAllRecords(req, res) {
  try {
    const records = await Transaction.find().sort({ date: -1, createdAt: -1 }).lean();
    return res.json({ ok: true, count: records.length, records });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Something went wrong" });
  }
}

async function getFilteredRecordsAnalyst(req, res) {
  const built = buildFilterFromQuery(req.query, {});
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

module.exports = {
  getAllRecords,
  getFilteredRecordsAnalyst,
};
