const express = require('express');
const bodyParser = require('body-parser');
const compromise = require('compromise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Your code for processing user input and providing recommendations
app.post('/recommend', (req, res) => {
  const userInput = req.body.text;
  // Your logic for processing user input and providing recommendations
  res.json({ recommendations: ['Car1', 'Car2', 'Car3'] });
});

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
