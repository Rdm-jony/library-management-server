const express = require('express');
const cors = require('cors');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tbsccmb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    // strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const bookCollection = client.db('LibraryManagement').collection('books')

    app.post('/books', async (req, res) => {
      const newBook = req.body;
      const result = await bookCollection.insertOne(newBook)
      res.send(result)
    })

    app.get('/category', async (req, res) => {
      const bookCategories = []
      const category = await bookCollection.distinct('bookCategory')
      const allBooks = await bookCollection.find().toArray()
      category.map(async item => {
        const findBook = allBooks.find(book => book.bookCategory == item)
        if (findBook) {

          bookCategories.push({ category: findBook?.bookCategory, image: findBook?.bookImage })
        }
      })
      res.send(bookCategories)

    })
  } finally {

  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("library management running")
})

app.listen(port, () => {
  console.log(`library management running on port on ${port}`)
})