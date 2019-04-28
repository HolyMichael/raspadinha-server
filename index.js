console.log("I'm alive");

const express = require('express')
const path = require('path');
const app = express()
const port = 3000

app.use(express.static('./html'))

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname+'/html/registry.html'), function (err) {
	    if (err) {
	      res.send("Enganaste-te pah!")
	    }
  	});
})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}!`)
})


