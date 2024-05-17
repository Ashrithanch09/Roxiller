const express = require('express');

const mongoose = require('mongoose');
const AggregateError =require( 'es-aggregate-error');

const app = express();
const port = 5000;


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://yaduvanshiharsh26:sorcerer@roxiler.juxkmxd.mongodb.net/?retryWrites=true&w=majority&appName=Roxiler";

//mongodb connection
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

// endpoint api/data

app.get('/api/data', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const data = response.data;

        // Delete all existing documents
        await ProductTransaction.deleteMany({});

        // Save new data
        await ProductTransaction.insertMany(data);

        res.send('Database initialized');
    } catch (error) {
        console.error(`Error fetching data: ${error}`);
        if (error instanceof AggregateError) {
            console.error('AggregateError:', error.errors);
        }
        res.status(500).send('Error fetching data');
    }
});



// schema
const productTransactionSchema = new mongoose.Schema({
    id: Number,
    title: String,
    price: Number,
    description: String,
    category: String,
    image: String,
    sold: Boolean,
    dateOfSale: Date
});

const ProductTransaction = mongoose.model('ProductTransaction', productTransactionSchema);

// endpoint api/products
app.get('/api/products', async (req, res) => {
    const month = req.query.month;

    if (!month) {
        return res.status(400).send('Month is required');
    }

    // Parse the month into a number (January is 0, December is 11)
    const monthNumber = new Date(`${month} 1, 1970`).getMonth();

    const products = await ProductTransaction.find({
        dateOfSale: {
            $gte: new Date(1970, monthNumber, 1),
            $lt: new Date(1970, monthNumber + 1, 1)
        }
    });

    res.send(products);
});

// endpoint api/transactions
app.get('/api/transactions', async (req, res) => {
  const search = req.query.search;
  const page = req.query.page || 1;
  const perPage = req.query.perPage || 10;

  const query = search
      ? { $or: [
              { title: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
              { price: { $regex: search, $options: 'i' } }
          ]}
      : {};

  const transactions = await ProductTransaction.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage);

  res.send(transactions);
});
// endpoint api/statistics
app.get('/api/statistics', async (req, res) => {
  const year = req.query.year;
  const month = req.query.month;

  if (!year || !month) {
      return res.status(400).send('Year and month are required');
  }

  // Parse the year and month into numbers
  const yearNumber = parseInt(year);
  const monthNumber = parseInt(month) - 1; // JavaScript counts months from 0 (January) to 11 (December)

  // Find all transactions for the given month
  const transactions = await ProductTransaction.find({
      dateOfSale: {
          $gte: new Date(yearNumber, monthNumber, 1),
          $lt: new Date(yearNumber, monthNumber + 1, 1)
      }
  });

  // Calculate the total sale amount
  const totalSaleAmount = transactions.reduce((total, transaction) => total + transaction.price, 0);

  // Calculate the total number of sold and not sold items
  const totalSoldItems = transactions.filter(transaction => transaction.sold).length;
  const totalNotSoldItems = transactions.length - totalSoldItems;

  // Send the statistics
  res.send({
      totalSaleAmount,
      totalSoldItems,
      totalNotSoldItems
  });
});

//endpoint api/stats for graph
app.get('/api/statistics', async (req, res) => {
  const year = req.query.year;
  const month = req.query.month;

  if (!year || !month) {
      return res.status(400).send('Year and month are required');
  }

  // Parse the year and month into numbers
  const yearNumber = parseInt(year);
  const monthNumber = parseInt(month) - 1; // JavaScript counts months from 0 (January) to 11 (December)

  // Define the price ranges
  const priceRanges = [
      { min: 0, max: 100 },
      { min: 101, max: 200 },
      { min: 201, max: 300 },
      { min: 301, max: 400 },
      { min: 401, max: 500 },
      { min: 501, max: 600 },
      { min: 601, max: 700 },
      { min: 701, max: 800 },
      { min: 801, max: 900 },
      { min: 901, max: Infinity }
  ];

  // Fetch the transactions for the given month
  const transactions = await ProductTransaction.find({
      dateOfSale: {
          $gte: new Date(yearNumber, monthNumber, 1),
          $lt: new Date(yearNumber, monthNumber + 1, 1)
      }
  });

  // Count the number of items in each price range
  const counts = priceRanges.map(range => ({
      range: `${range.min}-${isFinite(range.max) ? range.max : 'above'}`,
      count: transactions.filter(transaction => transaction.price >= range.min && transaction.price <= range.max).length
  }));

  // Send the counts
  res.send(counts);
});

//endpoint api/cateories
app.get('/api/categories', async (req, res) => {
  const year = req.query.year;
  const month = req.query.month;
  
  if (!year || !month) {
      return res.status(400).send('Year and month are required');
  }

  // Parse the year and month into numbers
  const yearNumber = parseInt(year);
  const monthNumber = parseInt(month) - 1; // JavaScript counts months from 0 (January) to 11 (December)

  // Fetch the transactions for the given month
  const transactions = await ProductTransaction.find({
      dateOfSale: {
          $gte: new Date(yearNumber, monthNumber, 1),
          $lt: new Date(yearNumber, monthNumber + 1, 1)
      }
  });

  // Group the transactions by category and count the number of items in each category
  const categories = {};
  transactions.forEach(transaction => {
      if (!categories[transaction.category]) {
          categories[transaction.category] = 0;
      }
      categories[transaction.category]++;
  });

  // Convert the categories object to an array of { category, count } objects
  const result = Object.keys(categories).map(category => ({
      category,
      count: categories[category]
  }));

  // Send the result
  res.send(result);
});

//endpoint api/combined
app.get('/api/combined', async (req, res) => {
  const year = req.query.year;
  const month = req.query.month;

  if (!year || !month) {
      return res.status(400).send('Year and month are required');
  }

  try {
      // Fetch data from the 3 APIs
      const [dataResponse, productsResponse, categoriesResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/data?year=${year}&month=${month}`),
          axios.get(`http://localhost:5000/api/products?year=${year}&month=${month}`),
          axios.get(`http://localhost:5000/api/categories?year=${year}&month=${month}`)
      ]);

      // Combine the responses
      const combinedResponse = {
          data: dataResponse.data,
          products: productsResponse.data,
          categories: categoriesResponse.data
      };

      // Send the combined response
      res.send(combinedResponse);
  } catch (error) {
      console.error(`Error fetching data: ${error}`);
      res.status(500).send('Error fetching data');
  }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
