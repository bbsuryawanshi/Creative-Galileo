const express = require('express')
const router = express.Router()
const Candlestick = require('../models/candlestickData')
const moment = require('moment')

// Getting all
router.post('/daily_candle', async (req, res) => {
  try {
    console.log('inside this');
    const {
      fromDate,
      toDate
    } = req.body

    let { page, size } = req.query;

    if(!page) {
      page = 1
    }

    if(!size) {
      size = 100
    }

    if(size > 100) {
      throw "max 100 rows per call"
    }

    const limit = parseInt(size);
    const skip = (page-1) * size;
    console.log('limit ===>', limit);
    console.log('skip ===>', skip);
    console.log('fromDate ===>', fromDate);
    const convertedFromDate = new Date(fromDate);
    const convertedToDate = new Date(toDate);
    console.log('convertedFromDate ====>', convertedFromDate);
    console.log('convertedToDate ====>', convertedToDate);
    const candlestickData = await Candlestick.find({
      Date: {
        $gte: convertedFromDate,
        $lt: convertedToDate
      }
    }).limit(limit).skip(skip)
    res.json(candlestickData)
  } catch (err) {
    console.log('error ===>', err);
    res.status(500).json({
      message:  err.message ? err.message : err
    })
  }
})

//  get data by week number and year
router.get('/weekly/:year/:weekNo', async (req, res) => {
  try {
    // find date range from week number
    const {
      year,
      weekNo
    } = req.params
    const startOfWeek = moment(year).add(weekNo, 'weeks').startOf('isoweek');
    const endOfWeek = moment(year).add(weekNo, 'weeks').endOf('isoweek');

    const query = [{
        $facet: {
          "minMaxValue": [{
            "$match": {
              "Date": {
                "$lte": new Date(endOfWeek),
                "$gte": new Date(startOfWeek)
              }
            }
          }, {
            "$group": {
              _id: null,
              "max": {
                "$max": "$High"
              },
              "min": {
                "$min": "$Low"
              }
            }
          }],
          openValue: [{
            $match: {
              Date: {
                "$lte": new Date(moment(startOfWeek).format('MM/DD/YYYY')),
                "$gte": new Date(moment(startOfWeek).format('MM/DD/YYYY'))
              }
            }
          }, {
            $project: {
              Open: 1,
              _id: 0
            }
          }],
          closeValue: [{
            $match: {
              Date: {
                "$lte": new Date(moment(endOfWeek).format('MM/DD/YYYY')),
                "$gte": new Date(moment(endOfWeek).format('MM/DD/YYYY'))
              }
            }
          }, {
            $project: {
              Close: 1,
              _id: 0
            }
          }]
        }
      },
      {
        $project: {
          "maxValue": {
            $arrayElemAt: ["$minMaxValue.max", 0]
          },
          "minValue": {
            $arrayElemAt: ["$minMaxValue.min", 0]
          },
          "openValue": {
            $arrayElemAt: ["$openValue.Open", 0]
          },
          "closeValue": {
            $arrayElemAt: ["$closeValue.Close", 0]
          }
        }
      }
    ]
    // find data
    const candlestickWeeklyData = await Candlestick.aggregate(query)

    res.json(candlestickWeeklyData[0])
  } catch (err) {
    res.status(500).json({
      message: err.message ? err.message : err
    })
  }
})

module.exports = router