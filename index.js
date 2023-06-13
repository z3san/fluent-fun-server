const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();

const cors = require("cors");
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Fluent fun server is running')
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vzimcou.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();
    const usersCollection = client.db("fluentfun").collection("users");
    const classesCollection = client.db("fluentfun").collection("classes")
    const classesCartCollection = client.db("fluentfun").collection("classesCart")
  
    


    // Get all users
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // conditional login
    app.get("/role", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

// Update user role
app.patch('/users/admin/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      role: 'admin'
    },
  };
  const result = await usersCollection.updateOne(filter, updateDoc);
  res.send(result);
})
app.patch('/users/instructor/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      role: 'instructor'
    },
  };
  const result = await usersCollection.updateOne(filter, updateDoc);
  res.send(result);
})
//delete user

app.delete('/users/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await usersCollection.deleteOne(query);
  res.send(result);
})

    // Add a new user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "User already exists" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Handle Google sign-in
    app.post("/users/google", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "User already exists" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    //Get all classes
    app.get("/classes", async (req, res) => {
      try {
        const coursesCollection = client.db("fluentfun").collection("classes");
        const courses = await coursesCollection.find().toArray();
        res.send(courses);
      } catch (error) {
        console.error("Error retrieving courses:", error);
        res.status(500).send("Error retrieving courses");
      }
    });

//Payment intent
app.post("/create-payment-intent", async (req, res) => {
  const { price } = req.body;
  const amount = parseInt(price * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    payment_method_types: ["card"],
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
}); 
  //payment
  app.get("/classesCarts/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await classesCartCollection.findOne(query);
    res.send(result);
  });
  
  
  app.put("/payments/:id", async (req, res) => {
    const payment = req.body;
    const id = req.params.id;
    const updateDoc = {
      $set: payment,
    };
    const query = { _id: new ObjectId(id) };
    const options = { upsert: true };
    // console.log(payment);
    const result = await classesCartCollection.updateOne(query, updateDoc, options);
    res.send(result);
  });
//payment
app.get("/classesCarts/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await classesCartCollection.findOne(query);
  res.send(result);
});


app.put("/payments/:id", async (req, res) => {
  const payment = req.body;
  const id = req.params.id;
  const updateDoc = {
    $set: payment,
  };
  const query = { _id: new ObjectId(id) };
  const options = { upsert: true };
  // console.log(payment);
  const result = await classesCartCollection.updateOne(query, updateDoc, options);
  res.send(result);
});

app.put("/classUpdates/:id", async (req, res) => {
  const data = req.body;
  const id = req.params.id;
  const updateDoc = {
    $set: data,
  };
  const query = { _id: new ObjectId(id) };
  const options = { upsert: true };
  // console.log(payment);
  const result = await classesCollection.updateOne(query, updateDoc, options);
  res.send(result);
});



//sort 6 data
app.get('/classes', async (req, res) => {
  const enrolledStudent = Number(req.query.enrolledStudent); 
  try {
    const result = await classesCollection.find({ enrolledStudent: enrolledStudent }).sort({ enrolledStudent: -1 }).limit(6).toArray();
    res.send(result);
    console.log(data);
  } catch (error) {
    console.error('Error fetching data from MongoDB', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});







// Update class status to approved
app.patch('/classes/approve/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      status: 'approved'
    },
  };
  try {
    const result = await classesCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    console.error("Error approving class:", error);
    res.status(500).send("Error approving class");
  }
});

// Update class status to denied
app.patch('/classes/deny/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      status: 'denied'
    },
  };
  try {
    const result = await classesCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    console.error("Error denying class:", error);
    res.status(500).send("Error denying class");
  }
});



// Send feedback for a class
app.post('/classes/feedback/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const feedback = req.body.feedback;
  const updateDoc = {
    $set: {
      feedback: feedback
    },
  };
  try {
    const result = await classesCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    console.error("Error sending feedback:", error);
    res.status(500).send("Error sending feedback");
  }
});
//My class email fetching
app.get("/class", async (req, res) => {
  const email = req.query.email;
  const query = { email: email };
  const result = await classesCollection.find(query).toArray();
  res.send(result);
});
//approved classes on class page// students
app.get("/approvedClasses", async (req, res) => {
  const query = { status: "approved" };
  const result = await classesCollection.find(query).toArray();
  res.send(result);
});

//Student cart collection

app.post("/classesCarts", async (req, res) => {
  const item = req.body;
  const query = { email: item.email, classId: item.classId };
  const existingClass = await classesCartCollection.findOne(query);
  if (existingClass) {
    console.log(existingClass);
    return res.send({ message: "Class already exists" });
  }
  const result = await classesCartCollection.insertOne(item);
  res.send(result);
});

// get student cart collection

app.get("/classesCarts",  async (req, res) => {
  const email = req.query.email;

  if (!email) {
    res.send([]);
  }
  const query = { email: email };
  const result = await classesCartCollection.find(query).toArray();
  res.send(result);
});
// Delete  classes from the cart
app.delete("/classesCarts/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await classesCartCollection.deleteOne(query);
  res.send(result);
});





//instructors page
app.get("/instructors", async (req, res) => {
  const query = { role: "instructor" };
  const result = await usersCollection.find(query).toArray();
  res.send(result);
});

// Create a new class
app.post("/classes", async (req, res) => {
  const newClass = req.body;
  try {
    const result = await classesCollection.insertOne(newClass);
    res.send(result);
  } catch (error) {
    console.error("Error creating new class:", error);
    res.status(500).send("Error creating new class");
  }
});


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Fluent fun is running on ${port}`);
});
