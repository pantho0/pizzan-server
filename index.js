const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors())
app.use(express.json())



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

    // To get all the foods 
    app.get("/api/v1/foods", async(req, res)=> {
      let query = {}
      if(req.query?.addedBy){
        query ={addedBy : req.query.addedBy}
      }
      const result = await foodCollection.find(query).toArray();
      res.send(result)
    })

    app.get("/api/v1/foods/:id", async(req, res)=> {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}

      const result = await foodCollection.findOne(query);
      res.send(result)
    })

    // orders api

    app.get("/api/v1/orders", async(req,res)=>{
      let query = {}
      if(req.query?.email){
        query ={email : req.query.email}
      }
      const result = await ordersCollection.find(query).toArray();
      res.send(result)
    })

    app.post("/api/v1/confirmPurchase", async(req,res)=> {
      const order = req.body;
      const result = await ordersCollection.insertOne(order)
      console.log(result);
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