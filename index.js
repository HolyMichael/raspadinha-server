console.log("I'm alive");

var mongoose = require('mongoose');


const { Crypto } = require("@peculiar/webcrypto");
const crypto = new Crypto();

const express = require('express')
const path = require('path')

var util = require('util');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


const mongo = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017/'

// mongo.connect(url, { useNewUrlParser: true }, (err, client) => {
// 	if (err) {
// 	  console.error(err)
// 	  return
// 	}

// 	const db = client.db('users')
// 	const collection = db.collection('users')

// 	var myobj = { name: "luis123", aeskey_servidor_cliente: "bbbbbb" };

// 	collection.insertOne(myobj, function(err, res) {
// 		if (err) throw err;
// 		console.log("1 document inserted");
// 		console.log(myobj._id)
// 	  });

// 	collection.find({}, {projection:{ _id:0 , name : 1}}).toArray(function(err, result){
// 		if (err) throw err;
//     	console.log(result);
// 	})

// 	client.close()
//   })



const port = 3000



app.use(express.static(__dirname + "/public"))  // define a pasta "root" onde são procurados ficheiros estáticos ex scripts de javascript

io.on('connection', function (socket) {
	console.log("User connected")

	var id = ""
	var client_publicKey
	var server_publicKey
	var server_privateKey
	var aes_client_server
	var aes_server_client

	//wrapper para esta parte toda, nao ligar a identacao
	socket.on("get_username", (name) => {


		socket.on("send_client_public_key", (data) => {
			// ---- RECEIVE CLIENT PUBLIC KEY
			print("-- SERVER RECEIVED CLIENT PUBLIC KEY FROM USER:" + name)
			client_publicKey = data
			print(data)

			crypto.subtle.generateKey({
				name: "RSA-OAEP",
				modulusLength: 1024,
				publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
				hash: { name: "SHA-256" },
			},
				true,
				["encrypt", "decrypt"]
			).then(function (key) {
				//returns a keypair object
				// console.log(key);

				server_publicKey = key.publicKey
				server_privateKey = key.privateKey
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
				).then(function (aes_key) {
					//E PRECISO EXPORTAR A CHAVE SIMETRICA PRIMEIRO
					crypto.subtle.exportKey(
					   "jwk", //can be "jwk" or "raw"
					   aes_key //extractable must be true
					   //KEYDATA CORRESPONDE A CHAVE SIMETRICA EXPORTADA
					).then(function (exported_aes) {
					console.log("AES key: " + exported_aes);
					aes_server_client = aes_key

					//PRIMEIRO TENHO QUE IMPORTAR A CHAVE PUBLICA DO CLIENTE PARA A USAR 
					crypto.subtle.importKey(
						"jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
						data,
						{   //these are the algorithm options
							name: "RSA-OAEP",
							hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
						},
						true, //whether the key is extractable (i.e. can be used in exportKey)
						["encrypt"] //"encrypt" or "wrapKey" for public key import or
						//"decrypt" or "unwrapKey" for private key imports
						//ENCRYPT THE GENERATED AES WITH THE IMPORTED PUBLIC KEY
					).then(function (publicKey) {
						console.log(publicKey);
						//É PRECISO FAZER ENCODE DA CHAVE SIMETRICA QUE FOI GERADA
						let enc = new util.TextEncoder();
						key_to_encrypt = enc.encode(exported_aes.k)

						crypto.subtle.encrypt(
							{
								name: "RSA-OAEP",
								//label: Uint8Array([...]) //optional
							},
							publicKey, //from generateKey or importKey above
							key_to_encrypt //ArrayBuffer of data you want to encrypt
							//SEND THE ENCRYPTED KEY TO THE CLIENT
						).then(function (encrypted) {
							print("------- about to send:")
							socket.emit("encrypted_server_aes_key", encrypted)

							//TODO
							//returns an ArrayBuffer containing the encrypted data
							//   console.log(new Uint8Array(encrypted));
							//   socket.emit("encrypted_client_aes_key", encrypted)
						})

					})
				})
				})

				//RECEIVES CLIENT CIPHERED AES KEY
				socket.on("encrypted_client_aes_key", (cipheredKey) => {
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
							alg: "A256CTR",
							ext: true,
							k: '"' + dec_key + '"',
							key_ops: ["encrypt", "decrypt"],
							kty: "oct"
						}

						crypto.subtle.importKey("jwk", //can be "jwk" or "raw"
							key, {   //this is the algorithm options
								name: "AES-CTR",
							},
							true, //whether the key is extractable (i.e. can be used in exportKey)
							["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
						).then(function (client_server_aes_key) {
							//returns the symmetric key
							aes_client_server = client_server_aes_key
							// console.log(client_server_aes_key);

							mongo.connect(url, { useNewUrlParser: true }, (err, client) => {
								if (err) {
									console.error(err)
									return
								}

								const db = client.db('users')
								const collection = db.collection('users')

								var myobj = {
									name: name, server_privateKey: server_privateKey,
									server_publicKey: server_publicKey, client_pubKey: client_publicKey,
									aes_server_client: aes_server_client, aes_client_server: aes_client_server
								};

								collection.insertOne(myobj, function (err, res) {
									if (err) throw err;
									id = myobj._id
									console.log("1 document inserted " + myobj._id + " " + id);
								});

								client.close()
								return
							})

						})
					})
				})
			}).catch(function (err) {
				console.error(err);
			});
		})


	})

	socket.on("teste", (data) => {
		teste = data
		print("ass " + teste)
	})

	socket.on('disconnect', function () {
		console.log('user disconnected')
	})

})





http.listen(port, function () {
	console.log('listening on *:3000');
});

app.get('/', (req, res) => {
	res.render("homepage.ejs")
})

app.get('/register', (req, res) => {
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

function print(stuff) {
	console.log(stuff)
}

/**
* retorna uma string com os valores da chave recebida
* @param {*} key chave a imprimir
* @returns string da chave
*/
function key_print(key) {
	return JSON.stringify(key, null, " ")
}

/**
 * retorna o objecto do tipo crypto key
 * @param {*} key_data normalmente um json que corresponde aos parametros da chave
 */
function rebuild_key_json(k) {
	var json = '{"alg":"A256CTR","ext":true,"k":"' + k + '","key_ops":["encrypt","decrypt"],"kty":"oct"}'
	print("------ rebuilded json: ")
	print(json)

	return json
}