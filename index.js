const express = require('express')
const mongoDB = require("./db");
const app = express()
const port = 4000
var cors = require('cors')

app.use(express.json())
app.use(cors())

app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})

mongoDB();

app.use('/api',require("./Routes/authRoutes"));
  
  