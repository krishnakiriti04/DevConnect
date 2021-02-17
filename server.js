const express = require('express');
const connectDB = require("./config/db");
const users = require("./routes/api/users");
const profile = require("./routes/api/profile");
const posts = require("./routes/api/posts");
const auth = require("./routes/api/auth");

const app = express();

//connect to DB
connectDB();
const PORT = process.env.PORT || 5000;

//Init middleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => {
    res.send("API running");
})

// Defining the routes
app.use('/api/users', users);
app.use('/api/profile', profile);
app.use('/api/auth', auth);
app.use('/api/posts', posts);

app.listen(PORT, () => {
    console.log(`Server Started at port ${PORT}`)
});