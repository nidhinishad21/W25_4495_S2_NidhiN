const mongoose = require('mongoose');
const expenseSchema = new mongoose.Schema({
 expense: { type: String, required: true },
 amount: { type: Number, required: true },
 category: { type: String, required: true },
 user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
 date: { type: Date, default: Date.now }
 });
module.exports = mongoose.model('Expense', expenseSchema);