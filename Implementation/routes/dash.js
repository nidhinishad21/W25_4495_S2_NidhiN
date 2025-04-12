// routes/auth.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const Expense = require("../models/Expense");
const User = require("../models/User");
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const jwt = require('jsonwebtoken');
const path = require('path');

router.get("/", verifyToken, async (req, res) => {
  let firstname = req.firstname;

  // Calculate first and last day of current month if no dates provided
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const defaultFrom = formatDate(firstDay);
  const defaultTo = formatDate(lastDay);

  let p_data = await getExpensesByCategoryOnDateRange(
    req.username,
    firstDay,
    lastDay
  );

  res.render("dashboard/home.ejs", {
    path: "/dashboard",
    firstname: firstname,
    c_data: p_data,
    from: defaultFrom,
    to: defaultTo,
  });
});


router.get('/date-range', verifyToken, async (req, res) => {
  try {
    // Get from and to dates from query parameters
    const { from, to } = req.query;
    
    // Validate input
    if (!from || !to) {
      res.render("common/error.ejs", {
        message: "Both from and to dates are required",
      });
    }
    
    // Convert string dates to Date objects
    const startDate = new Date(from);
    const endDate = new Date(to);

    let p_data = await getExpensesByCategoryOnDateRange(
      req.username,
      startDate,
      endDate
    );
    
    
    res.render("dashboard/home.ejs", {
      path: "/dashboard",
      firstname: req.firstname,
      c_data: p_data,
      from: from,
      to: to,
    });
    
  } catch (error) {
    console.error("Error:", error);
    res.render("common/error.ejs", {
      message: "Failed to add expense. Please try again.",
    });
  }
});



async function askGemini(
  prompt,
  apiKey = process.env.GOOGLE_API_KEY,
  model = "gemini-2.0-flash"
) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        // Disable streaming to get complete response at once
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    let data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    console.log(responseText);

    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
    console.log(cleanedJson);
    expense_json = JSON.parse(cleanedJson);

    if (expense_json.error) {
      console.error("Gemini returned an error:", expense_json.error);
      throw new Error("Failed to add expense. Please try again.");
    }

    return expense_json;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function saveExpense(expense_json, username) {
  const user = await User.findOne({ username });
  console.log(username);

  const { expense, amount, category } = expense_json;
  const newExpense = new Expense({ expense, amount, category, user: user._id });
  await newExpense.save();
  console.log("Expense added successfully:", newExpense);
}

async function getExpenses(username) {
  const user = await User.findOne({ username });
  const expenses = await Expense.find({ user: user._id }).sort({ date: -1 });
  return expenses;
}

async function getExpensesonDateRange(username, from, to) {
  const user = await User.findOne({ username });
  const expenses = await Expense.find({ user: user._id, date: { $gte: from, $lte: to } }).sort({ date: -1 });
  return expenses;
}

async function getExpensesByCategoryOnDateRange(username, from, to) {

  // Set endDate to end of day
  // to.setHours(23, 59, 59, 999);
  
  const user = await User.findOne({ username });

  // Query expenses within date range for this user
  const expenses = await Expense.find({
    user: user._id,
    date: {
      $gte: from,
      $lte: to
    }
  }).sort({ date: -1 });


  const categoryTotals = {};

  // Sum amounts by category
  expenses.forEach(({ category, amount }) => {
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
  });

  // Create data arrays for visualization
  const p_data = {
    labels: Object.keys(categoryTotals),
    values: Object.values(categoryTotals),
  };
  return p_data;

}


async function getExpensesByCategory(username) {
  const expenses = await getExpenses(username);

  const categoryTotals = {};

  // Sum amounts by category
  expenses.forEach(({ category, amount }) => {
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
  });

  // Create data arrays for visualization
  const p_data = {
    labels: Object.keys(categoryTotals),
    values: Object.values(categoryTotals),
  };

  return p_data;
}

router.post("/add-expense", verifyToken, async (req, res) => {
  try {
    console.log(req.body);
    let firstname = req.firstname;

    let expense = req.body.expense;

    let prompt =
      'Give me json response only for this expense in the format \
        {"expense": "expense name", "amount": "amount", category: "category"} for ' +
      expense +
      '. Example {"expense": "rent", "amount": "1000", category: "housing"}. \
        Allowed categories are housing, food, transportation, utilities, clothing, insurance, \
        medical, personal, debt, savings, entertainment, education, gifts, donations, investments, others. \
        If you are unable to provide this information, give me error json response in the format {"error": "error message"}.';

    let expense_json = await askGemini(prompt);
    await saveExpense(expense_json, req.username);

    // Calculate first and last day of current month if no dates provided
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const defaultFrom = formatDate(firstDay);
    const defaultTo = formatDate(lastDay);

    let p_data = await getExpensesByCategoryOnDateRange(
      req.username,
      defaultFrom,
      defaultTo
    );

    res.render("dashboard/home.ejs", {
      path: "/dashboard",
      firstname: firstname,
      c_data: p_data,
      message: "Expense added successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    res.render("common/error.ejs", {
      message: "Failed to add expense. Please try again.",
    });
  }
});

router.get("/insights", verifyToken, async (req, res) => {
  // Calculate first and last day of current month if no dates provided
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const defaultFrom = formatDate(firstDay);
  const defaultTo = formatDate(lastDay);

  const expenses = await getExpensesonDateRange(req.username, defaultFrom, defaultTo);

  if (expenses.length === 0) {
    res.render("dashboard/insights.ejs", {
      path: "/dashboard/insights",
      firstname: req.firstname,
      insights:  {
        Summary: "No expenses found",
        Insight: "You have not made any expenses in this period.",
        Suggestion: "Try adding some expenses to get insights.",
      }
    });
  } else {
    let prompt =
      'Give me summary, insights and some suggestions for expenses for this data in json only.\
      Assume the user is in Vancouver, Canada. Take this into consideration as well. \
      In the format {"Summary", "Some summary", "Insight" : "Some insight", "Suggestion" : "Some suggestion"}. Encode your data for \' \
      Keep it simple to understand. Expenses are in json as follows: ' + expenses;

    let insights = await askGemini(prompt);
    res.render("dashboard/insights.ejs", {
      path: "/dashboard/insights",
      firstname: req.firstname,
      insights: insights,
    });
  }
});

/**
 Everything related to categories is going to be here.
 */

router.get("/categories", verifyToken, async (req, res) => {

  // Calculate first and last day of current month if no dates provided
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const defaultFrom = formatDate(firstDay);
  const defaultTo = formatDate(lastDay);

  const expenses = await getExpensesByCategoryOnDateRange(req.username, defaultFrom, defaultTo);

  if (expenses.length === 0) {
    res.render("dashboard/categories.ejs", {
      path: "/dashboard/categories",
      firstname: req.firstname,
      message: "No expenses found",
      expenses: [],
      from: defaultFrom,
      to: defaultTo,
    });
  } else {
    res.render("dashboard/categories.ejs", {
      path: "/dashboard/categories",
      firstname: req.firstname,
      expenses: expenses,
      message: "",
      from: defaultFrom,
      to: defaultTo,
    });
  }
});

router.get("/categories/date-range", verifyToken, async (req, res) => {

  // Get from and to dates from query parameters
  const { from, to } = req.query;
    
  // Validate input
  if (!from || !to) {
    res.render("common/error.ejs", {
      message: "Both from and to dates are required",
    });
  }
  
  // Convert string dates to Date objects
  const startDate = new Date(from);
  const endDate = new Date(to);

  const expenses = await getExpensesByCategoryOnDateRange(req.username, startDate, endDate);
  
  if (expenses.length === 0) {
    res.render("dashboard/categories.ejs", {
      path: "/dashboard/categories",
      firstname: req.firstname,
      message: "No expenses found",
      expenses: [],
      from: from,
      to: to,
    });
  } else {
    res.render("dashboard/categories.ejs", {
      path: "/dashboard/categories",
      firstname: req.firstname,
      expenses: expenses,
      message: "",
      from: from,
      to: to,
    });
  }
});

/**
 Everything related to transactions is going to be here.
 */

 router.get('/transactions/date-range', verifyToken, async (req, res) => {
  try {
    // Get from and to dates from query parameters
    const { from, to } = req.query;
    
    // Validate input
    if (!from || !to) {
      res.render("common/error.ejs", {
        message: "Both from and to dates are required",
      });
    }
    
    // Convert string dates to Date objects
    const startDate = new Date(from);
    const endDate = new Date(to);

    const expenses = await getExpensesonDateRange(req.username, startDate, endDate);
    res.render("dashboard/transactions.ejs", {
      path: "/dashboard/transactions",
      firstname: req.firstname,
      expenses: expenses,
      success_msg: req.query.success_msg || "",
      from: from,
      to: to,
    });

  } catch (error) {
    console.error("Error:", error);
    res.render("common/error.ejs", {
      message: "Failed to fetch expenses. Please try again.",
    });
  }
});

router.get("/transactions", verifyToken, async (req, res) => {
  try {

    // Calculate first and last day of current month if no dates provided
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const defaultFrom = formatDate(firstDay);
    const defaultTo = formatDate(lastDay);


    const expenses = await getExpensesonDateRange(req.username, defaultFrom, defaultTo);
    res.render("dashboard/transactions.ejs", {
      path: "/dashboard/transactions",
      firstname: req.firstname,
      expenses: expenses,
      success_msg: req.query.success_msg || "",
      from: defaultFrom,
      to: defaultTo,
    });
  } catch (error) {
    console.error("Error:", error);
    res.render("common/error.ejs", {
      message: "Failed to fetch expenses. Please try again.",
    });
  }
});

// Delete transaction route
router.get("/transactions/delete/:id", verifyToken, async (req, res) => {
  try {
    const expenseId = req.params.id;

    // Find the expense to verify it belongs to the user
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).render("common/error.ejs", {
        message: "Expense not found.",
      });
    }

    // Find the user
    const user = await User.findOne({ username: req.username });

    // Verify the expense belongs to the current user
    if (expense.user.toString() !== user._id.toString()) {
      return res.status(403).render("common/error.ejs", {
        message: "You don't have permission to delete this expense.",
      });
    }

    // Delete the expense
    await Expense.findByIdAndDelete(expenseId);

    // Redirect back to transactions page with success message
    res.redirect(
      "/dashboard/transactions?success_msg=Expense+deleted+successfully"
    );
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.render("common/error.ejs", {
      message: "Failed to delete expense. Please try again.",
    });
  }
});

// Edit transaction route - GET (Show edit form)
router.get("/transactions/edit/:id", verifyToken, async (req, res) => {
  try {
    const expenseId = req.params.id;

    // Find the expense
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).render("common/error.ejs", {
        message: "Expense not found.",
      });
    }

    // Find the user
    const user = await User.findOne({ username: req.username });

    // Verify the expense belongs to the current user
    if (expense.user.toString() !== user._id.toString()) {
      return res.status(403).render("common/error.ejs", {
        message: "You don't have permission to edit this expense.",
      });
    }

    // Render the edit form
    res.render("dashboard/edit-transaction.ejs", {
      path: "/dashboard/transactions",
      firstname: req.firstname,
      expense: expense,
    });
  } catch (error) {
    console.error("Error fetching expense for edit:", error);
    res.render("common/error.ejs", {
      message: "Failed to load expense for editing. Please try again.",
    });
  }
});

// Edit transaction route - POST (Process edit form)
router.post("/transactions/edit/:id", verifyToken, async (req, res) => {
  try {
    const expenseId = req.params.id;
    const { expense, amount, category, date } = req.body;

    // Validate input
    if (!expense || !amount || !category) {
      return res.render("common/error.ejs", {
        message: "All fields are required.",
      });
    }

    // Find the expense to verify it belongs to the user
    const existingExpense = await Expense.findById(expenseId);
    if (!existingExpense) {
      return res.status(404).render("common/error.ejs", {
        message: "Expense not found.",
      });
    }

    // Find the user
    const user = await User.findOne({ username: req.username });

    // Verify the expense belongs to the current user
    if (existingExpense.user.toString() !== user._id.toString()) {
      return res.status(403).render("common/error.ejs", {
        message: "You don't have permission to edit this expense.",
      });
    }

    // Update the expense
    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      {
        expense,
        amount: parseFloat(amount),
        category,
        date: date || existingExpense.date,
      },
      { new: true }
    );

    // Redirect back to transactions page with success message
    res.redirect(
      "/dashboard/transactions?success_msg=Expense+updated+successfully"
    );
  } catch (error) {
    console.error("Error updating expense:", error);
    res.render("common/error.ejs", {
      message: "Failed to update expense. Please try again.",
    });
  }
});


// Bulk Upload route

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)){
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Route that renders the bulk upload page
router.get("/bulk-upload", verifyToken, async (req, res) => {
  try {
    res.render("dashboard/bulk-upload.ejs", {
      path: "/dashboard/bulk-upload",
      firstname: req.firstname,
      message: ""
    });
  } catch (error) {
    console.error("Error:", error);
    res.render("common/error.ejs", {
      message: "Failed to load bulk upload page. Please try again."
    });
  }
});

// Route to handle the CSV upload and validate with Gemini
router.post("/bulk-upload/validate", verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.render("dashboard/bulk-upload.ejs", {
        path: "/dashboard/bulk-upload",
        firstname: req.firstname,
        message: "Please upload a CSV file."
      });
    }

    const results = [];
    
    // Read and parse the CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          // Process the CSV data with Gemini

          let prompt =
          'Give me json response only for these expenses in json array format \
            [{"expense": "expense name", "amount": "amount", category: "category", date: "date"}] for ' +
          JSON.stringify(results) +
          '. Example [{"expense": "rent", "amount": "1000", category: "housing", date: "2025-04-09"}, {"expense": "movie", "amount": "10", category: "entertainment", date: "2025-03-15"}]. \
            Allowed categories are housing, food, transportation, utilities, clothing, insurance, \
            medical, personal, debt, savings, entertainment, education, gifts, donations, investments, others. \
            If you are unable to categories the category, write "others" in the category field. \
            If you are unable to provide this information, give me error json response in the format {"error": "error message"}.';

          const processedData = await askGemini(prompt);
          
          // Create a temporary JWT token to store the processed data
          const tempToken = jwt.sign(
            { bulkExpenses: processedData },
            'your-secret-key',
            { expiresIn: '1h' } // Short expiration time for security
          );
          
          // Set the temporary token as a cookie
          res.cookie('temp-expenses', tempToken, {
            httpOnly: true,
            maxAge: 3600000 // 1 hour in milliseconds
          });
          
          // Render the validation page
          res.render("dashboard/bulk-upload-validate.ejs", {
            path: "/dashboard/bulk-upload/validate",
            firstname: req.firstname,
            expenses: processedData
          });
          
          // Delete the temporary file
          fs.unlinkSync(req.file.path);
        } catch (error) {
          console.error("Error processing data:", error);
          res.render("common/error.ejs", {
            message: "Failed to process CSV data. Please check your file format and try again."
          });
        }
      });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.render("common/error.ejs", {
      message: "Failed to upload file. Please try again."
    });
  }
});

// Route to save validated expenses to MongoDB
router.post("/bulk-upload/save", verifyToken, async (req, res) => {
  try {
    // Get the processed expenses from the JWT token in cookies
    const tempToken = req.cookies['temp-expenses'];
    const username = req.username;
    
    if (!tempToken) {
      return res.render("common/error.ejs", {
        message: "No expenses found to save. Please upload your CSV file again."
      });
    }
    
    // Verify and decode the token
    const decoded = jwt.verify(tempToken, 'your-secret-key');
    const expenses = decoded.bulkExpenses;
    
    if (!expenses || expenses.length === 0) {
      return res.render("common/error.ejs", {
        message: "No expenses found to save. Please upload your CSV file again."
      });
    }
    
    // Check if the form data contains updated expenses
    let expensesToSave = expenses;
    if (req.body.expenses && Array.isArray(req.body.expenses)) {
      expensesToSave = req.body.expenses;
    }
    
    const user = await User.findOne({ username });

    // Create expense documents in MongoDB
    const expenseDocuments = expensesToSave.map(exp => ({
      expense: exp.expense,
      amount: parseFloat(exp.amount),
      category: exp.category,
      date: new Date(exp.date),
      user: user._id, // From the verifyToken middleware
    }));
    
    // Save all expenses to MongoDB
    await Expense.insertMany(expenseDocuments);
    
    // Clear the temporary cookie
    res.clearCookie('temp-expenses');
    
    // Render success page
    res.render("dashboard/upload-success.ejs", {
      path: "/dashboard/bulk-upload",
      firstname: req.firstname,
      count: expenseDocuments.length
    });
  } catch (error) {
    console.error("Error saving expenses:", error);
    res.render("common/error.ejs", {
      message: "Failed to save expenses to database. Please try again."
    });
  }
});

module.exports = router;