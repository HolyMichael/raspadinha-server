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


var teste = 0
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
					console.log("AES key: " + key);
					
					//PRIMEIRO TENHO QUE IMPORTAR A CHAVE PUBLICA DO CLIENTE PARA A USAR 
					crypto.subtle.importKey(
					   "jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
					   data,
					   {   //these are the algorithm options
						   name: "RSA-OAEP",
						   hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
					   },
					   true, //whether the key is extractable (i.e. can be used in exportKey)
					   ["encrypt"] //"encrypt" or "wrapKey" for public key import or
								   //"decrypt" or "unwrapKey" for private key imports
					//ENCRYPT THE GENERATED AES WITH THE IMPORTED PUBLIC KEY
				   ).then(function(publicKey){
					   console.log(publicKey);
					   //É PRECISO FAZER ENCODE DA CHAVE SIMETRICA QUE FOI GERADA
					   let enc = new util.TextEncoder();
					   key_to_encrypt = enc.encode(key)
	 
					   crypto.subtle.encrypt(
						  {
							  name: "RSA-OAEP",
							  //label: Uint8Array([...]) //optional
						  },
						  publicKey, //from generateKey or importKey above
						  key_to_encrypt //ArrayBuffer of data you want to encrypt
					   //SEND THE ENCRYPTED KEY TO THE CLIENT
					   ).then(function(encrypted){
						  //returns an ArrayBuffer containing the encrypted data
						//   console.log(new Uint8Array(encrypted));
						//   socket.emit("encrypted_client_aes_key", encrypted)
					  })
	 
				})

				})

				//RECEIVES CLIENT CIPHERED AES KEY
				socket.on("encrypted_client_aes_key", (cipheredKey) =>{	
					console.log(cipheredKey);
					crypto.subtle.decrypt(
						{
							name: "RSA-OAEP",
							//label: Uint8Array([...]) //optional
						},
						key.privateKey, //from generateKey or importKey above
						cipheredKey //ArrayBuffer of the data
					).then((decrypted_key) => {
						print(decrypted_key.byteLength)
						let dec = new util.TextDecoder();
						dec_key = dec.decode(decrypted_key)
						
						print("----- decripted key -----")
						print(key_print(dec_key))

						let key = {
							alg:"A256CTR",
							ext:true,
							k:'"' + dec_key + '"',
							key_ops:["encrypt","decrypt"],
							kty:"oct"
						}
								
						crypto.subtle.importKey( "jwk", //can be "jwk" or "raw"
						key, {   //this is the algorithm options
								name: "AES-CTR",
							},
							true, //whether the key is extractable (i.e. can be used in exportKey)
							["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
						).then(function(client_server_aes_key){
								//returns the symmetric key
								console.log(client_server_aes_key);
						})
					})
			})
		}).catch(function(err){
			console.error(err);
		});
	})
	
	socket.on("teste", (data) =>{
		teste = data
		print("ass " + teste)
	})

	socket.on('disconnect',function(){
		console.log('user disconnected')
	})

})





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
 function rebuild_key_json(k){
	var json = '{"alg":"A256CTR","ext":true,"k":"'+ k +'","key_ops":["encrypt","decrypt"],"kty":"oct"}'
	print("------ rebuilded json: ")
	print(json)
	
	return json
 }