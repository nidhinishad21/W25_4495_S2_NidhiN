let mongoose = require('mongoose');

class Database {
  constructor() {
    this._connect();
  }

  _connect() {
    mongoose
      .connect(`mongodb+srv://dbPractice:62dlIxUYBhDGArPI@cluster0.isquhpy.mongodb.net/fintrack?retryWrites=true&w=majority&appName=Cluster0`)
      .then(() => {
        console.log('Database connection successful');
      })
      .catch((err) => {
        console.error('Database connection error');
      });
  }
}

module.exports = new Database();