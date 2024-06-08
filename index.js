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

      // jwt post 
      app.post('/jwt', async (req, res) => {
        const user = req.body
        const token = jwt.sign(user, process.env.token, {expiresIn: '1h'})
        res.send({token})
      })
      const verifyJWT = (req, res, next) => {
        if(!req.headers.authorization) {
          return res.status(401).send({message: 'forbidden access'})
        }
        const token = authorization.split(' ')[1]
        jwt.verify(token, process.env.token, (err, decoded) => {
          if(err) {
            return res.status(401).send({message: err.message})
          }
          req.decoded = decoded
          next()
        })
        
      }
       // add university
       app.post('/university', async (req, res) => {
        const query = req.body
        const result = await universityCollection.insertOne(query)
        res.send(result)
       })

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
    // delete university by admin or moderator
    app.delete('/university/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await universityCollection.deleteOne(query)
      res.send(result)
    })
    // update university by admin and moderatter
    app.put('/university/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const options = {upsert: true}
      const update = req.body
      const updateUniversity = {
        $set: {
          scholarshipName: update.scholarshipName,
          universityName: update.universityName,
          universityImage: update.universityImage,
          country: update.country,
          city: update.city,
          universityWorldRank: update.universityWorldRank,
          subjectName: update.subjectName,
          scholarshipCategory: update.scholarshipCategory,
          degree: update.degree,
          tuitionFees: update.tuitionFees,
          applicationFees: update.applicationFees,
          serviceCharge: update.serviceCharge,
          applicationDeadline: update.applicationDeadline,
          postDate: update.postDate,
        }
      }
      const result = await universityCollection.updateOne(query,updateUniversity, options )
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
        const result = await reviewsCollection.find({ email: email}).toArray()
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
    // users api
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
    // delete users
    app.delete('/users/:id', async (req,res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })
    // add role
    app.patch('/users/:id/role', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const {role} = req.body
      const options = {upsert: true}
      const updateDoc = {
        $set: {
          role: role,
        }
      }
      const result = await usersCollection.updateOne(query, updateDoc,options)
      res.send(result)
    })
    // get the role from users
    app.get('/users/role/:email', async (req, res) => {
     const email = req.params.email
      const query = {email: email}
      const user = await usersCollection.findOne(query)
      if(user) {
        res.send({role: user.role})
      }
    })
    // payment gateway methods
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
      if(email) {
        const result = await applicationsCollection.find({email: email}).toArray()
        res.send(result)
      } else {
        const result = await applicationsCollection.find().toArray()
        res.send(result)
      }
     
    })
    // application update by admin
    app.patch('/applications/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const update = req.body 
      const updateStatus = {
        $set:{
          status: update.status,
        }
      }
      const result = await applicationsCollection.updateOne(query,updateStatus)
      res.send(result)
    })
    // pathc for feedback
    app.put('/applications/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const update = req.body
      const options = {upsert: true}
      const updateDoc = {
        $set: {
          feedback: update.feedback
        }
      }
      const result = await applicationsCollection.updateOne(query, updateDoc, options)
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
           'address.district': update.address.district,
           'address.country': update.address.country,
            gender: update.gender,
            degree: update.degree,
            sscResult: update.sscResult,
            hscResult: update.hscResult,
            studyGap: update.studyGap,
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