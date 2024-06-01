const express = require('express')
const cors = require('cors')
require('dotenv').config()
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 3000

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

    app.get('/university', async (req, res) => {
        const result = await universityCollection.find().toArray()
        res.send(result)
    })

    app.post('/users', async (req, res) => {
        const query = req.body
        const result = await usersCollection.insertOne(query)
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