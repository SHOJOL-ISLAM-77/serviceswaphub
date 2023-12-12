const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.PORT || 7000;

// MIDDLEWARE

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://serviceswaphub.web.app",
      "https://serviceswaphub.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const tokenVerify = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log("verify token in the middleware", token);
  if (!token) {
    return res.status(401).send({ massage: "not authorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ massage: "unauthorized" });
    }
    console.log(decoded);
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u6ptml9.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // start

    const servicesCollection = client.db("serviceDB").collection("services");
    const bookingCollection = client.db("serviceDB").collection("booking");
    const reviewCollection = client.db("serviceDB").collection("reviews");

// review related api 

app.get("/api/v1/reviews", async(req, res) =>{
  const result = await reviewCollection.find().sort({ _id: -1 }).limit(6).toArray();
  res.send(result);
})

app.post("/api/v1/review-posts", async(req, res) =>{
  const review = req.body;
  console.log(review);
  const result = await reviewCollection.insertOne(review);
  res.send(result);
})

// jwt related api

    app.post("/api/v1/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/api/v1/user-logout", async (req, res) => {
      const user = req.body;
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    app.post("/api/v1/add-services", async (req, res) => {
      const services = req.body;
      // console.log(services);
      const result = await servicesCollection.insertOne(services);
      res.send(result);
    });

    app.get("/api/v1/get-services-for-home", async (req, res) => {
      console.log(req.cookies.token);
      const result = await servicesCollection.find().limit(4).toArray();
      res.send(result);
    });
    app.get("/api/v1/get-services", async (req, res) => {
      const result = await servicesCollection.find().toArray();
      res.send(result);
    });

    app.get("/api/v1/get-serviceDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await servicesCollection.findOne(query);
      res.send(result);
    });

    app.post("/api/v1/book-services", async (req, res) => {
      const services = req.body;
      // console.log(services);
      const result = await bookingCollection.insertOne(services);
      res.send(result);
    });

    app.get("/api/v1/get-my-services",  async (req, res) => {
      query = { yourEmail: req.query.email };
      // if (req.user.email !== req.query.email) {
      //   return res.status(403).send({ massage: "forbidden access" });
      // }
      const result = await servicesCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/api/v1/get-my-booking-services", async (req, res) => {
      query = { userEmail: req.query.email };

      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/api/v1/get-my-pending-services", async (req, res) => {
      query = { serviceProviderEmail: req.query.email };

      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/api/v1/get-serviceDetails-bottom", async (req, res) => {
      query = { yourEmail: req.query.email };

      const result = await servicesCollection.find(query).toArray();
      res.send(result);
    });

    // /api/v1/get-serviceDetails-bottom

    app.delete("/api/v1/delete-service/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await servicesCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/api/v1/delete-booking-service/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/api/v1/update-my-services/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {
        _id: new ObjectId(id),
      };
      const data = req.body;
      const options = { upsert: true };

      const updateProduct = {
        $set: {
          serviceImage: data.serviceImage,
          serviceName: data.serviceName,
          yourName: data.yourName,
          price: data.price,
          serviceArea: data.serviceArea,
          description: data.description,
          photo: data.photo,
        },
      };
      const result = await servicesCollection.updateOne(
        filter,
        updateProduct,
        options
      );
      res.send(result);
    });

    app.put("/api/v1/update-pending-work/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {
        _id: new ObjectId(id),
      };
      const data = req.body;
      const options = { upsert: true };

      const updateProduct = {
        $set: {
          status: data.selectValue,
        },
      };
      const result = await bookingCollection.updateOne(
        filter,
        updateProduct,
        options
      );
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
