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
    const paymentsCollection = await client.db('scholarHub').collection('payments')
    const applicationsCollection = await client.db('scholarHub').collection('applications')

    // get all university
    app.get('/university', async (req, res) => {
      const queryText = req.query.query || '';
      if(queryText) {
        const query = {
          $or: [
            { scholarshipCategory: { $regex: queryText, $options: 'i' } },
            { universityName: { $regex: queryText, $options: 'i' } },
            { subjectName: { $regex: queryText, $options: 'i' } },
          ]
        };
        const result = await universityCollection.find(query).sort({ price: -1, postDate: -1 }).toArray();
        res.send(result);
      } else {
        const result = await universityCollection.find().sort({ price: -1, postDate: -1 }).toArray();
      res.send(result);
      }
    });

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
      const email = req.query.email
      if(email) {
        const result = await reviewsCollection.findOne({ email: email}).toArray()
        res.send(result)
      } else {
        const result = await reviewsCollection.find().toArray()
      res.send(result)
      }
      
    })
    // get single reviews
    app.get('/reviews/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await reviewsCollection.findOne(query)
      res.send(result)
    })
    // delete single reviews
    app.delete('/reviews/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await reviewsCollection.deleteOne(query)
      res.send(result)
    })
    // update reviews single
    app.put('/reviews/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const options = {upsert: true}
      const update = req.body 
      const updateReview = {
        $set: {
          reviewer_comments: update.reviewer_comments,
          reviewer_rating: update.reviewer_rating
        }
      }
      const result = await reviewsCollection.updateOne(query, updateReview, options)
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
    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
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

    app.post('/payments', async (req, res) => {
      const query = req.body
      const result = await paymentsCollection.insertOne(query)
      res.send(result)
    })
    // post application
    app.post('/applications', async (req, res) => {
      const query = req.body
      const result = await applicationsCollection.insertOne(query)
      res.send(result)
    })
    // get all applications by email address
    app.get('/applications', async (req, res) => {
      const email = req.query.email
      const result = await applicationsCollection.find({email: email}).toArray()
      res.send(result)
    })
    // get single application by id wise
    app.get('/applications/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await applicationsCollection.findOne(query)
      res.send(result)
    })
    // delete the application by id
    app.delete('/applications/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await applicationsCollection.deleteOne(query)
      res.send(result)
    })
    // update application by id
    app.put('/applications/:id', async (req, res) => {
      const id = req.params.id 
      const query = {_id: new ObjectId(id)}
      const options = {upset: true}
      const update = req.body
      const updateApplication = {
        $set: {
           photo: update.photo,
           'address.village': update.address.village,
        }
      }
      const result = await applicationsCollection.updateOne(query,updateApplication,options)
      res.send(result)
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