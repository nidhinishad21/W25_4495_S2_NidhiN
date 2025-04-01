## FinTrack
A web app where users can track income/expenses, set budgets, and visualize their financial habits with interactive charts.

### NOVELTY
Input data in Natural language (text). For e.g. "had $50 dinner" & Google Gemini will take care of everything. 

### Tech Stack 
* Bootstrap with EJS (front-end)
* Node.js (back-end) 
* MongoDB (database) 

### Target Users
Individuals managing personal finances or small businesses who wants to track their cash flow. 

### Features
* User Management (Login/Logout, profile management for each user. 
* Visualization of expense and savings with real-time insights from Google Gemini.
* categorization of expenses (e.g. dining, grocery, rent, fuel) 

### Pre-Requisites
* Create a mongodb database from [Mongo DB Portal](https://www.mongodb.com/resources/products/fundamentals/create-database). Get the connection string and database name for this mongo database. Put this in .env file. 
* Get a gemini API key from [Google AI Studio](https://aistudio.google.com/apikey). Put the key in .env file.

### Run the App

```
cd/Implementation
npm i
node index.js
```

By default, the webApp runs at http://localhost:5000

### Instructions Sample
* Register a new account by clicking on register.
* Login with this new account.
* Start adding your expenses.

  
