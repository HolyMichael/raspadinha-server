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
var server_publicKey
var server_privateKey

app.use(express.static(__dirname + "/public"))  // define a pasta "root" onde são procurados ficheiros estáticos ex scripts de javascript

io.on('connection',function(socket){
	console.log("User connected")

	socket.on("send_client_public_key", (data) =>{	
			// ---- RECEIVE CLIENT PUBLIC KEY
			print("-- SERVER RECEIVED CLIENT PUBLIC KEY")
			client_publicKey = data
			print(data)

			crypto.subtle.generateKey({
				name: "RSA-OAEP",
				modulusLength: 1024,
				publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
				hash: {name: "SHA-256"}, 
				},
				true,
				["encrypt", "decrypt"]
			).then(function(key){
				//returns a keypair object
				// console.log(key);
				//  console.log(key.publicKey);

				//----- SEND SERVER PUBLIC KEY TO CLIENT
				socket.emit("send_server_public_key", key.publicKey)
				server_publicKey = key.publicKey
				// console.log(key.privateKey);

				// -------------- GENERATE SIMMETRIC KEY: SERVER ===> CLIENT
				crypto.subtle.generateKey(
				{
					name: "AES-CTR",
					length: 256, //can be  128, 192, or 256
					},
					true, //whether the key is extractable (i.e. can be used in exportKey)
					["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
				).then(function(key){
				   //returns a key object
				  console.log(key);
				})




			})
			.catch(function(err){
				console.error(err);
			});


	
	})
	
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
									true, ["encrypt"] ).then((result) => {
										// print("~~~~~ key returning: ~~~~~\n " + key_print(result))
										client_publicKey = result
									});
 }