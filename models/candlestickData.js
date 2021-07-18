const mongoose = require('mongoose')

const candlestickSchema = new mongoose.Schema({
  date: {
    type: Date
  },
  Open: {
    type: Number
  },
  Close: {
    type: Number
  },
  High: {
    type: Number
  },
  Low: {
    type: Number
  }
})

module.exports = mongoose.model('candlestick', candlestickSchema)