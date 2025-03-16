// routes/auth.js
 const express = require('express');
 const router = express.Router();
 const verifyToken = require('../middleware/authMiddleware');
 const Expense = require('../models/Expense');
 const User = require('../models/User');

router.get('/', verifyToken, async(req, res) => {
    let firstname = req.firstname;
    
    let p_data = await getExpenses(req.username);

    res.render("dashboard/home.ejs" , { path: '/dashboard', firstname: firstname, c_data: p_data});
 });

 router.get('/insights', verifyToken, (req, res) => {
    res.render('dashboard/insights.ejs', {
        path: '/dashboard/insights',
        firstname: req.firstname
    });
});
router.get('/transactions', verifyToken, (req, res) => {
    res.render('dashboard/transactions.ejs', {
        path: '/dashboard/transactions',
        firstname: req.firstname
    });
});
router.get('/categories', verifyToken, (req, res) => {
    res.render('dashboard/categories.ejs', {
        path: '/dashboard/categories',
        firstname: req.firstname
    });
});

async function askGemini(prompt, apiKey=process.env.GOOGLE_API_KEY, model = 'gemini-2.0-flash') {
    try {
      
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{ 
            parts: [{ text: prompt }]
            }],
            // Disable streaming to get complete response at once
            generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
            }
        })
        });
        
        let data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;
        console.log(responseText);

        const cleanedJson = responseText.replace(/```json|```/g, '').trim();
        console.log(cleanedJson);
        expense_json = JSON.parse(cleanedJson);

        if (expense_json.error) {
            console.error("Gemini returned an error:", expense_json.error);
            throw new Error("Failed to add expense. Please try again.");
        }

        return expense_json;

    } catch (error) {
        console.error('Error:', error);
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
    const user
     = await User.findOne({ username });
    const expenses = await Expense.find({ user: user._id });
    
    const categoryTotals = {};

    // Sum amounts by category
    expenses.forEach(({ category, amount }) => {
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });

    // Create data arrays for visualization
    const p_data = {
    labels: Object.keys(categoryTotals),
    values: Object.values(categoryTotals)
    };
    
    return p_data;
}



router.post('/add-expense', verifyToken, async (req, res) => {
    try {
        console.log(req.body);
        let firstname = req.firstname;

        let expense = req.body.expense;

        let prompt = "Give me json response only for this expense in the format \
        {\"expense\": \"expense name\", \"amount\": \"amount\", category: \"category\"} for " + expense + 
        ". Example {\"expense\": \"rent\", \"amount\": \"1000\", category: \"housing\"}. \
        Allowed categories are housing, food, transportation, utilities, clothing, insurance, \
        medical, personal, debt, savings, entertainment, education, gifts, donations, investments, others. \
        If you are unable to provide this information, give me error json response in the format {\"error\": \"error message\"}.";

        let expense_json = await askGemini(prompt);
        await saveExpense(expense_json, req.username);

        let p_data = await getExpenses(req.username);

        res.render("dashboard/home.ejs" , { path: '/dashboard', firstname: firstname, c_data: p_data, message: 'Expense added successfully'});
    } catch (error) {
        console.error('Error:', error);
        res.render("common/error.ejs", { message: 'Failed to add expense. Please try again.' });
    }
    
});



 module.exports = router;