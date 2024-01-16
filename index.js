const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// mongoDB
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// dotenv
require('dotenv').config()

// jwt
const jwt = require('jsonwebtoken');

// cookie parser
const cookieParser = require('cookie-parser');


// middleware
// app.use(cors()); // for normal use case

app.use(cors({
    origin: [
        // 'http://localhost:5173',
        'https://car-service-2dc17.web.app',
        'https://car-service-2dc17.firebaseapp.com'
    ],
    credentials: true,
})); 

app.use(express.json());
app.use(cookieParser());

// custom middleware:
const logger = async (req, res, next) => {
    console.log('logger info:', req.method, req.url, req.host)
    next();
}

// verify token middleware:
const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    console.log('Middleware token:', token);

    // if no token
    if (!token) {
        return res.status(401).send({message: 'Unauthorized'})
    };

    // for available token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({message: "Unauthorized"})
        }

        req.user = decoded;
        next();
    })
}


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


        // auth related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user);

            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})

            res
            .cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
                })
            .send({successToken: true});
        })
        
        // logOut clear cookie
        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user)
            res.clearCookie('token', {maxAge: 0}).send({clearToken: 'Success'})
        })


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

        // insert checkout data
        app.post('/checkouts',  async (req, res) => {
            const order = req.body;
            // console.log(order);
            const result = await checkOutCollection.insertOne(order);
            res.send(result)
        })

        // get checkout data
        app.get('/checkouts', logger, verifyToken, async (req, res) => {
            console.log('From checkouts: ', req.query.email);
            
            console.log('From server cookies:', req.cookies)

            if (req.user.email !== req.query.email) {
                return res.status(403).send({message: 'Forbidden Access'})
            }

            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email };
            };
            const result = await checkOutCollection.find(query).toArray();
            res.send(result)
        })

        // delete checkouts
        app.delete('/checkouts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await checkOutCollection.deleteOne(query);
            res.send(result);
        })


        // update pending status
        app.patch('/checkouts/:id', async (req, res) => {
            const id = req.params.id;
            const updatedStatus = req.body;
            const query = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: updatedStatus.status
                },
            };

            const result = await checkOutCollection.updateOne(query, updatedDoc);
            res.send(result);
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

