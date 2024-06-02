const express = require('express')
const cors = require('cors')
require('dotenv').config()
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 3000
const stripe = require('stripe')(process.env.Pyament_Api_Key)
app.use(express.json())
app.use(cors())
app.use(cookieParser())



const uri = `mongodb+srv://${process.env.Db_User}:${process.env.Db_Password}@cluster0.2m0rny5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const universityCollection = await client.db('scholarHub').collection('university')
    const usersCollection = await client.db('scholarHub').collection('users')
    const reviewsCollection = await client.db('scholarHub').collection('reviews')

    // get all university
    app.get('/university', async (req, res) => {
        const result = await universityCollection.find().toArray()
        res.send(result)
    })
    // get single University details
    app.get('/university/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await universityCollection.findOne(query)
      res.send(result)
    })
    // add review
    app.post('/reviews', async (req, res) => {
      const query = req.body
      const result = await reviewsCollection.insertOne(query)
      res.send(result)
    })
    // get reviews
    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray()
      res.send(result)
    })
    app.post('/users', async (req, res) => {
        const userData = req.body
        const email = userData?.email
        const checkUser = await usersCollection.findOne({ email: email})
        if (checkUser) {
          return res.status(400).send({ message: 'user already exists'})
        } else {
          const result = await usersCollection.insertOne(userData)
        res.send(result)
        }
        
    })

    app.post('/create-payment-intent', async (req, res) => {
      const {price} = req.body
      const amount = parseInt(price * 100)
      console.log(amount)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        payment_method_types: ['card'],
        currency: "usd",
      })
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    })

   } finally {

  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Welcome to the server')
})

app.listen(port, () => {
    console.log('listening on port ' + port)
})