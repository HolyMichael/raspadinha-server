console.log("I'm alive");

const crypto = require('crypto')
const express = require('express')
const path = require('path');
const app = express()
const port = 3000

app.use(express.static("public")) // define a pasta "root" onde são procurados ficheiros estáticos ex scripts de javascript

app.listen(port, () => {
	console.log(`Example app listening on port ${port}!`)
})

app.get('/',(req,res)=>{
	res.render("homepage.ejs")
})

app.get('/register', (req,res)=>{
	res.render("register.ejs")
})

app.get('/register/:pk/:user', (req,res) =>{
	console.log("User:"+req.params.user)
	console.log("Public Key:"+req.params.pk)
	res.render("working.ejs")
	//we save the fantastic key
})

/*app.get('*', (req, res) => {
	res.redirect("404 error")
})*/