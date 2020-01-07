const express = require('express')
const app = express()
const port = process.env.PORT || 80

app.use(express.static('.'))

app.listen(port, () => console.log(`Xcom timeline - port: ${port}`))