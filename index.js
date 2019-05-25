console.log("I'm alive");

const { Crypto } = require("@peculiar/webcrypto");
const crypto = new Crypto();

const express = require('express')
const path = require('path')

var util= require('util');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const port = 3000

var client_publicKey

app.use(express.static(__dirname + "/public"))  // define a pasta "root" onde são procurados ficheiros estáticos ex scripts de javascript

io.on('connection',function(socket){
	console.log("User connected")

	socket.on("send_public_key", (data) =>{
		// data = {
		// 	"alg": "RSA-OAEP-256",
		// 	"e": "AQAB",
		// 	"ext": true,
		// 	"key_ops": [
		// 	"encrypt"
		// 	],
		// 	"kty": "RSA",
		// 	"n": "qpQq_P-hJqtqpQPSGduc-xcqcRRzt5tOGrvOO-M5vL5zcWA1NBOCYx9NXhFmLBTMOg1o-36YtmW36QFP-PGP3uM8A53pyZMzl-NAE_CYUE85g1Xj3VamZN8hKX4Lp1_MN8edYXekWllsQxAhdfRrwuNX108r59SVtqoq9wVU9ts"
		// }

		json_to_key(data).then(key => {
			print("something happened");
			print("Server received: " + key_print(key));
			
			// var ct = encrypt("hi", key).then(
			// print(ct)
		})
		
		
	});

	socket.on('disconnect',function(){
		console.log('user disconnected')
	}
)})


http.listen(port, function(){
	console.log('listening on *:3000');
  });

app.get('/',(req,res)=>{
	res.render("homepage.ejs")
})

app.get('/register', (req,res)=>{
	res.render("register.ejs")
})

// app.get('/register/:pk/:user', (req,res) =>{
// 	console.log("User:"+req.params.user)
// 	console.log("Public Key:"+req.params.pk)
// 	// res.render("working.ejs")
// 	//we save the fantastic key
// })

/*app.get('*', (req, res) => {
	res.redirect("404 error")
})*/

function encrypt(text, publicKey){
	text = "ola ;)"
	let enc = new util.TextEncoder();
	encoded_text = enc.encode(text);
	
	let ct = crypto.subtle.encrypt({name: "RSA-OAEP"}, publicKey, encoded_text );
	print("ciphertext:" + ct)

	return ct
}

function decrypt(ct, privateKey){
	let enc = new util.TextEncoder();
	let encoded_ct = enc.encode(ct)
	let dec = crypto.subtle.decrypt({name:"RSA-OAEP"}, privateKey, encoded_ct);

	print("123" + dec)

 return dec
}

function print(stuff){
	console.log(stuff)
 }

 /**
 * retorna uma string com os valores da chave recebida
 * @param {*} key chave a imprimir
 * @returns string da chave
 */
function key_print(key){
	return JSON.stringify(key, null, " ")
 }

 /**
  * retorna o objecto do tipo crypto key
  * @param {*} key_data normalmente um json que corresponde aos parametros da chave
  */
 function json_to_key(key_data){
	return crypto.subtle.importKey("jwk", key_data,{ name: "RSA-OAEP", hash: "SHA-256" },
									true, ["encrypt"] ).then( function (result){
										client_publicKey = result
										print("~~~~~ key returning: ~~~~~\n " + key_print(result))
									});
 }