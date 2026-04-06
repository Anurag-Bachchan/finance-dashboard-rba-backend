const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

function invalidId(res) {
  return res.status(400).json({ ok: false, message: "Invalid id" });
}

async function createTransaction(req, res) {
  const { userId, amount, type, category, date, note } = req.body;

  if (!userId || amount === undefined || !type || !category || !date) {
    return res.status(400).json({
      ok: false,
      message: "userId, amount, type, category, and date are required",
    });
  }

  if (!mongoose.isValidObjectId(userId)) {
    return invalidId(res);
  }

  try {
    const owner = await User.findById(userId);
    if (!owner) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const txn = await Transaction.create({
      userId,
      amount: Number(amount),
      type,
      category,
      date: new Date(date),
      ...(note !== undefined ? { note: String(note) } : {}),
    });

    await User.findByIdAndUpdate(userId, { $push: { transactions: txn._id } });

    return res.status(201).json({ ok: true, message: "Transaction created", transaction: txn });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ ok: false, message: err.message });
    }
    console.error(err);
    return res.status(500).json({ ok: false, message: "Something went wrong" });
  }
}

async function updateTransaction(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return invalidId(res);
  }

  const txn = await Transaction.findById(id);
  if (!txn) {
    return res.status(404).json({ ok: false, message: "Transaction not found" });
  }

  const { userId, amount, type, category, date, note } = req.body;
  const updates = {};
  if (userId !== undefined) {
    if (!mongoose.isValidObjectId(userId)) {
      return invalidId(res);
    }
    updates.userId = userId;
  }
  if (amount !== undefined) updates.amount = Number(amount);
  if (type !== undefined) updates.type = type;
  if (category !== undefined) updates.category = category;
  if (date !== undefined) updates.date = new Date(date);
  if (note !== undefined) updates.note = String(note);

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ ok: false, message: "No valid fields to update" });
  }

  const oldUserId = txn.userId.toString();
  const newUserId = updates.userId !== undefined ? String(updates.userId) : oldUserId;

  try {
    if (updates.userId !== undefined && newUserId !== oldUserId) {
      const nextOwner = await User.findById(newUserId);
      if (!nextOwner) {
        return res.status(404).json({ ok: false, message: "User not found" });
      }
    }

    const updated = await Transaction.findByIdAndUpdate(id, { $set: updates }, {
      new: true,
      runValidators: true,
    });

    if (updates.userId !== undefined && newUserId !== oldUserId) {
      await User.findByIdAndUpdate(oldUserId, { $pull: { transactions: txn._id } });
      await User.findByIdAndUpdate(newUserId, { $addToSet: { transactions: txn._id } });
    }

    return res.json({ ok: true, message: "Transaction updated", transaction: updated });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ ok: false, message: err.message });
    }
    console.error(err);
    return res.status(500).json({ ok: false, message: "Something went wrong" });
  }
}

async function deleteTransaction(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return invalidId(res);
  }

  const txn = await Transaction.findById(id);
  if (!txn) {
    return res.status(404).json({ ok: false, message: "Transaction not found" });
  }

  const userId = txn.userId.toString();

  try {
    await Transaction.findByIdAndDelete(id);
    await User.findByIdAndUpdate(userId, { $pull: { transactions: txn._id } });
    return res.json({ ok: true, message: "Transaction deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Something went wrong" });
  }
}

module.exports = {
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
