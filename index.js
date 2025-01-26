const express = require('express');
const cors = require('cors');
const app = express()
var jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: ['http://localhost:5173','https://jovial-piroshki-143f3e.netlify.app'],
  credentials: true,

}))
app.use(express.json())
app.use(cookieParser('secret'));

const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access!' })

  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRETE, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access!' })
    }
    req.user = decoded;
    next()
  });

}

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
    const myBookCollection = client.db('LibraryManagement').collection('myBooking')

    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRETE, { expiresIn: '1h' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      }).send({ status: true })

    })

    app.get('/books', async (req, res) => {
      const home = req.query.home;
      const currentPage = req.query.currentPage;
      let query = {}
      const itemperPage = req.query.size;
      if (home == 'true') {
        const result = await bookCollection.find().limit(3).toArray()
        return res.send(result)
      }
      if (req.query.category) {
        query = { bookCategory: req.query.category }
      }
      console.log(req.query.category)
      const result = await bookCollection.find(query).skip((parseInt(currentPage) - 1) * parseInt(itemperPage)).limit(parseInt(itemperPage)).toArray()
      res.send(result)
    })

    app.get("/booksCount", async (req, res) => {
      let query = {}
      if (req.query.category) {
        query = { bookCategory: req.query.category }

      }
      const count = await bookCollection.countDocuments(query)
      res.send({ count })
    })

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

    app.get('/books/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bookCollection.findOne(query)
      console.log(result)
      res.send(result)
    })

    app.post('/myBook', async (req, res) => {
      const myBooking = req.body;
      const query = { bookId: myBooking.bookId, buyerEmail: myBooking.buyerEmail }
      const alreadyFound = await myBookCollection.findOne(query)
      if (alreadyFound) {
        return res.send({ message: 'Already have this book' })
      }
      const result = await myBookCollection.insertOne(myBooking)
      res.send(result)
    })
    app.get('/myBooks/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const result = await myBookCollection.find({ buyerEmail: email }).toArray()
      res.send(result)
    })
    app.patch('/books/:id', async (req, res) => {
      const id = req.params.id;
      const quantity = req.body;
      const filter = { _id: new ObjectId(id) }
      const doc = {
        $set: {
          quantity: quantity.quantityRemaining
        }
      }
      const result = await bookCollection.updateOne(filter, doc)
      res.send(result)
    })
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

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