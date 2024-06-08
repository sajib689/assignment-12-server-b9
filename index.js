const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.Pyament_Api_Key);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173'] }));
app.use(cookieParser());

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
    await client.connect();
    
    const db = client.db('scholarHub');
    const universityCollection = db.collection('university');
    const usersCollection = db.collection('users');
    const reviewsCollection = db.collection('reviews');
    const paymentsCollection = db.collection('payments');
    const applicationsCollection = db.collection('applications');

    // JWT generation
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.token, { expiresIn: '1h' });
      res.send({ token });
    });

    const verifyJWT = (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
      }
      const token = authHeader.split(' ')[1];
      jwt.verify(token, process.env.token, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'Unauthorized access' });
        }
        req.decoded = decoded;
        next();
      });
    };

    // Verify Admin Middleware
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const user = await usersCollection.findOne({ email });
      if (user && (user.role === 'admin' || user.role === 'moderator')) {
        next();
      } else {
        return res.status(403).send({ message: 'Access denied: Admins only' });
      }
    };

    // University Routes
    app.post('/university', verifyJWT, verifyAdmin, async (req, res) => {
      const university = req.body;
      const result = await universityCollection.insertOne(university);
      res.send(result);
    });

    app.get('/university', async (req, res) => {
      const queryText = req.query.query || '';
      const query = queryText ? {
        $or: [
          { scholarshipCategory: { $regex: queryText, $options: 'i' } },
          { universityName: { $regex: queryText, $options: 'i' } },
          { subjectName: { $regex: queryText, $options: 'i' } }
        ]
      } : {};
      const result = await universityCollection.find(query).sort({ price: -1, postDate: -1 }).toArray();
      res.send(result);
    });

    app.get('/university/:id', async (req, res) => {
      const id = req.params.id;
      const result = await universityCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.delete('/university/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const result = await universityCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.put('/university/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const update = req.body;
      const updateUniversity = {
        $set: {
          ...update
        }
      };
      const result = await universityCollection.updateOne({ _id: new ObjectId(id) }, updateUniversity, { upsert: true });
      res.send(result);
    });

    // Review Routes
    app.post('/reviews', async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    app.get('/reviews', async (req, res) => {
      const email = req.query.email;
      const query = email ? { email } : {};
      const result = await reviewsCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const result = await reviewsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.delete('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

     // update reviews single
     app.put('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const update = req.body;
      const updateReview = {
        $set: {
          reviewer_comments: update.reviewer_comments,
          reviewer_rating: update.reviewer_rating
        }
      };
      const result = await reviewsCollection.updateOne(query, updateReview, options);
      res.send(result);
    });

    // User Routes
    app.post('/users', async (req, res) => {
      const userData = req.body;
      const email = userData?.email;
      const checkUser = await usersCollection.findOne({ email });
      if (checkUser) {
        return res.status(400).send({ message: 'User already exists' });
      }
      const result = await usersCollection.insertOne(userData);
      res.send(result);
    });

    app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.delete('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.patch('/users/:id/role', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role } },
        { upsert: true }
      );
      res.send(result);
    });

    app.get('/users/role/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'Unauthorized access' });
      }
      const user = await usersCollection.findOne({ email });
      if (user) {
        res.send({ role: user.role });
      } else {
        res.status(404).send({ message: 'User not found' });
      }
    });

    // Payment Routes
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        payment_method_types: ['card'],
        currency: "usd",
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      res.send(result);
    });

    // Application Routes
    app.post('/applications', async (req, res) => {
      const application = req.body;
      const result = await applicationsCollection.insertOne(application);
      res.send(result);
    });

    app.get('/applications', async (req, res) => {
      const email = req.query.email;
      const query = email ? { email } : {};
      const result = await applicationsCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/applications/:id', async (req, res) => {
      const id = req.params.id;
      const result = await applicationsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.delete('/applications/:id', async (req, res) => {
      const id = req.params.id;
      const result = await applicationsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.patch('/applications/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const update = req.body;
      const updateStatus = {
        $set: {
          status: update.status,
        }
      };
      const result = await applicationsCollection.updateOne({ _id: new ObjectId(id) }, updateStatus);
      res.send(result);
    });

    app.put('/applications/:id', async (req, res) => {
      const id = req.params.id;
      const update = req.body;
      const updateDoc = {
        $set: {
          feedback: update.feedback
        }
      };
      const result = await applicationsCollection.updateOne({ _id: new ObjectId(id) }, updateDoc, { upsert: true });
      res.send(result);
    });

    app.put('/applications/:id', async (req, res) => {
      const id = req.params.id;
      const update = req.body;
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
      };
      const result = await applicationsCollection.updateOne({ _id: new ObjectId(id) }, updateApplication, { upsert: true });
      res.send(result);
    });
  } finally {
    // await client.close(); (Consider commenting this out for long-running server)
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Welcome to the server');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
