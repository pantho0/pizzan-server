const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())


// own middleware
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log('token in the middleware', token);
  if(!token){
    return res.status(401).send({message:"Unauthorized"})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
    if(err){
      res.status(401).send({message:"Unauthorized"})
    }
    req.user = decoded;
    next()
  })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://pizzanMax:JWlao9oP9LpZeS12@cluster0.guubgk2.mongodb.net/?retryWrites=true&w=majority";

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
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const foodCollection = client.db("pizzanDB").collection("foods");
    const ordersCollection = client.db("pizzanDB").collection("orders");

    // JSON WEB TOKEN
    app.post("/jwt", async(req,res)=>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      res.send(user)
    })
    // if logout
    app.post("/logout", async(req,res)=>{
      const user = req.body;
      console.log('logging out the user', user);
      res.clearCookie('token', {maxAge:0}).send({success:true})
    })


    // To get all the foods 
    app.get("/api/v1/foods", async (req, res) => {
      let query = {}
      if (req.query?.addedBy) {
        query = { addedBy: req.query.addedBy }
      }
      // Pagination 
      const page = Number(req.query.page); //Number obj for make the url string to number value
      const limit = Number(req.query.limit);
      const skip = (page - 1) * limit;
      const result = await foodCollection.find(query).skip(skip).limit(limit).toArray();
      res.send(result)

    })

    // To count total foods 

    app.get("/api/v1/productcount", async (req, res) => {
      const result = await foodCollection.estimatedDocumentCount();
      res.send({ count: result })
    })

    // To get single food by id 
    app.get("/api/v1/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await foodCollection.findOne(query);
      res.send(result)
    })


    // for add product api
    app.post("/api/v1/addFood", async (req, res) => {
      const food = req.body;
      const result = await foodCollection.insertOne(food)
      console.log(result);
      res.send(result)
    })
    // For Update Product

    app.get("/update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await foodCollection.findOne(query);
      res.send(result)
    })

    app.put("/update/:id", async(req,res)=>{
      const id = req.params.id;
      console.log(id);
      const filter = {_id : new ObjectId(id)}
      console.log(filter);
      const options = {upsert: true}
      const updatedFood = {
        $set: {
          addedBy : data.addedBy, 
          availableQuantity : data.availableQuantity,
          description : data.description, 
          foodCategory : data.foodCategory, 
          foodImage : data.foodImage, 
          foodName : data.foodName, 
          foodOrigin : data.foodOrigin, 
          madeBy : data.madeBy, 
          orderCount : data.orderCount, 
          price : data.price
        } 
      }
      const result = await foodCollection.updateOne(filter, updatedFood, options)
      res.send(result)
    })

    // orders api

    app.get("/api/v1/orders", verifyToken, async(req, res) => {  
      console.log('token owner info', req.user);
      if(req?.user?.email !== req?.query?.email){
        return res.status(403).send({message:'Forbidden'})
        }
              
      let query = {}
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await ordersCollection.find(query).toArray();
      res.send(result)
    })

    app.post("/api/v1/confirmPurchase", async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order)
      console.log(result);
      res.send(result)
    })

    // Order Delete api 
    app.delete("/api/v1/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await ordersCollection.deleteOne(query)
      res.send(result)
    })









  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
  res.send("Pizzan Restaurant Server Running")
})


app.listen(port, () => {
  console.log(`Pizzan is running on port ${port}`);
})