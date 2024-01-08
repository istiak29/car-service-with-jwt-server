const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// mongoDB
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// dotenv
require('dotenv').config()


// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cirzz5b.mongodb.net/?retryWrites=true&w=majority`;


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

        const serviceCollection = client.db('carServiceDB').collection('services');
        const checkOutCollection = client.db('carServiceDB').collection('checkOuts');

        // get services data
        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        });

        // get service details
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await serviceCollection.findOne(query);
            res.send(result);
        })

        // // checkout form
        // app.get('/services/:id', async (req, body) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) };

        //     const options = {
        //         // Include only the `title` and `price`ans `service_id` and `img` fields in the returned document
        //         projection: { title: 1, service_id: 1, price: 1, img: 1, facility: 1 },
        //     };

        //     const result = await serviceCollection.findOne(query, option);
        //     res.send(result);
        // })

        // insert checkout data
        app.post('/checkouts', async (req, res) => {
            const order = req.body
            // console.log(order);
            const result = await checkOutCollection.insertOne(order);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('Car Service is Running in Web')
});

app.listen(port, () => {
    console.log('Server is running on port:', port)
})

