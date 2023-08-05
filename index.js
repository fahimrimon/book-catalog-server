require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

const cors = require("cors");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0fycq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });

const run = async () => {
  try {
    const db = client.db('book-catalog');
    const booksCollection = db.collection('books');
    const usersCollection = db.collection("users");

    // Authentication
    app.post("/auth/signup", async (req, res) => {
      const userData = req.body;

      const isExistUser = await usersCollection.findOne({
        email: userData.email,
      });
      if (isExistUser) {
        return res.status(400).send({
          message: "This email already exist!",
        });
      } else {
        // hashing password
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        userData.password = hashedPassword;

        const result = await usersCollection.insertOne(userData);
        if (result.acknowledged == true) {
          return res.status(200).send({
            message: "User sign up successfully!",
          });
        } else {
          return res.status(400).send({
            message: "Sign Up Failed!",
          });
        }
      }
    });

    app.post("/auth/login", async (req, res) => {
      const userData = req.body;
      const isAvailableUser = await usersCollection.findOne({
        email: userData.email,
      });
      if (!isAvailableUser) {
        return res.status(400).send({
          message: "This email does not exist!",
        });
      } else {
        const isPasswordMatched = await bcrypt.compare(
          userData.password,
          isAvailableUser.password
        );
        if (!isPasswordMatched) {
          return res.status(400).send({
            message: "Incorrect Password!",
          });
        } else {
          const accessToken = await jwt.sign(
            { email: isAvailableUser.email },
            "accessToken",
            { expiresIn: "30d" }
          );
          return res.status(200).send({
            message: "Login successfully!",
            token: accessToken,
          });
        }
      }
    });

    app.get('/books', async (req, res) => {
      const cursor = booksCollection.find({});
      const books = await cursor.toArray();
      console.log(books)
      res.send({ status: true, data: books });
      
    });

    app.get("/book/:id", async (req, res) => {
      const {id} = req.params;
      const book = await booksCollection.findOne({ _id: new ObjectId(id) });

      if (book) {
        return res.status(200).send({
          message: "Book details retrieved successfully!",
          data: book,
        });
      } else {
        return res.status(404).send({
          message: "Book not found",
        });
      }
    });

    app.get("/books/recent", async (req, res) => {
      const sort = { publishedYear: -1 };
      const result = await booksCollection
        .find({})
        .sort(sort)
        .limit(7)
        .toArray();
      return res.status(200).send({
        message: "Recent Published Books retrieved successfully!",
        data: result,
      });
    });

    
    // Add Book 

    app.post("/books", async (req, res) => {
          const bookData = req.body;
          const result = await booksCollection.insertOne(bookData);
          if (result.acknowledged == true) {
            return res.status(200).send({
              message: "Book added successfully!",
              data: bookData,
            });
          } else {
            return res.status(400).send({
              message: "Book added failed!",
            });
          }
      });



app.post('/comment/:id', async (req, res) => {
  const productId = req.params.id;
  const comment = req.body.comment;

  console.log(productId);
  console.log(comment);

  const result = await booksCollection.updateOne(
    { _id: new ObjectId(productId) },
    { $push: { comments: comment } }
  );

  console.log(result);

  if (result.modifiedCount !== 1) {
    console.error('Product not found or comment not added');
    res.json({ error: 'Product not found or comment not added' });
    return;
  }

  console.log('Comment added successfully');
  res.json({ message: 'Comment added successfully' });
});

app.get('/comment/:id', async (req, res) => {
  const productId = req.params.id;

  const result = await booksCollection.findOne(
    { _id: new ObjectId(productId) },
    { projection: { _id: 0, comments: 1 } }
  );

  if (result) {
    res.json(result);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

  } finally {
    // await client.close();
  }
}

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
