import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect('mongodb://localhost:27017');
    const db = client.db('my-blog');

    await operations(db);

    await client.close();
  } catch(error) {
    res.status(500).json({ message: "Error connecting to DB: ", error});
  }
}

app.get('/api/articles/:name', async (req,res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
  
    const articleInfo = await db.collection('articles').findOne({name: articleName});
    res.status(200).json(articleInfo);
  }, res);
});

app.post('/api/articles/:name/upvote', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db.collection('articles').findOne({name: articleName});
    await db.collection('articles').updateOne({name: articleName}, {
      "$set": {
        upvotes: articleInfo.upvotes + 1
      }
    });
    const updatedArticle = await db.collection('articles').findOne({name: articleName});

    res.status(200).json(updatedArticle);
  }, res);
})

app.post('/api/articles/:name/add-comment', (req, res) => {
  const articleName = req.params.name;
  const { username, text } = req.body;

  withDB(async (db) => {
    const articleInfo = await db.collection('articles').findOne({name: articleName});
    await db.collection('articles').updateOne({name: articleName}, {
      "$set": {
        comments: articleInfo.comments.concat({ username, text })
      }
    });
    const updatedArticle = await db.collection('articles').findOne({name: articleName});

    res.status(200).json(updatedArticle);
  }, res);
  
})

app.get('*', (req,res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log('Server is running on port 8000'));