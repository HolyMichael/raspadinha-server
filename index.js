console.log("I'm alive");

const crypto = require('crypto')
const express = require('express')
const path = require('path');
const app = express()
const port = 3000

const bodyParser = require ("body-parser")

app.use(bodyParser.urlencoded({extended:false}))

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

app.post('/Registar_User.html',(req,res)=>{
	console.log("A criar um user...")
	var username= req.body.Username
	console.log("User:"+ username)


	res.sendFile(path.join(__dirname+'/html/Registar_User.html'), function (err) {
		if (err) {
			res.send("Enganaste-te pah!")
		}
	});
})