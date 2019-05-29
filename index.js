console.log("Server alive");

const { Crypto } = require("@peculiar/webcrypto");
const crypto = new Crypto();

const crypto_server = require('crypto');
const express = require('express')
var util = require('util');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);


const mongo = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017/'
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

	socket.on("validate_username", (username) => {

		mongo.connect(url, { useNewUrlParser: true }, (err, client) => {
			if (err) {
				console.error(err)
				return
			}
			const db = client.db('users')
			const collection = db.collection('users')

			var query = { name: username };

			collection.find(query).toArray(function (err, result) {
				if (err) throw err;

				if (result.length == 0) {
					print("new user")
					socket.emit("existing_check", 0)
				}
				if (result.length != 0) {
					print("existing username")
					socket.emit("existing_check", 1)
				}
			})
		})

	})

	socket.on("get_username", (name) => {
		//resto do processo de registo
		socket.on("send_client_public_key", (data) => {
			// ---- RECEIVE CLIENT PUBLIC KEY
			print("-- SERVER RECEIVED CLIENT PUBLIC KEY FROM USER:" + name)
			client_publicKey = data
			// print(data)

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
						// console.log("AES key: " + exported_aes);
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
							// console.log(publicKey);
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
								// print("------- about to send:")
								socket.emit("encrypted_server_aes_key", encrypted)
							})

						})
					})
				})

				//RECEIVES CLIENT CIPHERED AES KEY
				socket.on("encrypted_client_aes_key", (cipheredKey) => {
					// console.log(cipheredKey);
					crypto.subtle.decrypt(
						{
							name: "RSA-OAEP",
							//label: Uint8Array([...]) //optional
						},
						key.privateKey, //from generateKey or importKey above
						cipheredKey //ArrayBuffer of the data
					).then((decrypted_key) => {
						// print(decrypted_key.byteLength)
						let dec = new util.TextDecoder();
						dec_key = dec.decode(decrypted_key)

						// print("----- decripted key -----")
						// print(key_print(dec_key))

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
		});
	});


	socket.on("login", (username) => {
		console.log(username + " TRYING TO LOG IN..")
		var nonce
		var client_publicKey

		crypto_server.randomBytes(256, (err, buf) => {
			if (err) throw err;
			nonce = buf.toString('base64')
			console.log(`${buf.length} bytes of random data: ${buf.toString('base64')}`);

			mongo.connect(url, { useNewUrlParser: true }, (err, client) => {
				if (err) {
					console.error(err)
					return
				}
				print("kek")
				const db = client.db('users')
				const collection = db.collection('users')


				collection.find({ name: username }).toArray(function (err, result) {
					if (err) throw err;

					client_publicKey = result[0].client_pubKey.n
					print(client_publicKey)

					socket.emit("receive_server_challenge", nonce)
				})
			})
			//a nonce deve ser cifrada antes de ser enviada




			socket.on("reply_to_challenge", (data) => {
				print("hi mark")
				let jason_key = {   //this is an example jwk key, other key types are Uint8Array objects
					kty: "RSA",
					e: "AQAB",
					n: client_publicKey,
					alg: "RSA-OAEP-256",
					ext: true,
				}
				crypto.subtle.importKey(
					"jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
					jason_key,
					{   //these are the algorithm options
						name: "RSA-OAEP",
						hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
					},
					true, //whether the key is extractable (i.e. can be used in exportKey)
					["decrypt"] //"encrypt" or "wrapKey" for public key import or
					//"decrypt" or "unwrapKey" for private key imports
				).then(function (publicKey) {

					crypto.subtle.decrypt(
						{
							name: "RSA-OAEP",
							//label: Uint8Array([...]) //optional
						},
						publicKey, //from generateKey or importKey above
						data //ArrayBuffer of the data
					)
						.then(function (decrypted) {
							//returns an ArrayBuffer containing the decrypted data
							print(decrypted)
						})

				})





			})

		});

	})

	socket.on("teste", (data) => {
		teste = data
		print("ass " + teste)
	})

	socket.on('disconnect', function () {
		console.log('user disconnected')
	})
	socket.on("raspServer", function (data) {
	
		function randomInt(low, high) {
			return Math.floor(Math.random() * (high - low) + low)
		  }
			var crypto = require('crypto');
			var input1 = "Perdeu!";
			var input2 = "Ganhou!";
		  
		  
			var g = 9;
			var n = 1001;
			var a = randomInt(5, 10);
			var b = randomInt(10, 15);
		  
		  
			server = (g * a) % n;
		  
			//console.log('O valor de g é: ', g);
			//console.log('O valor de n é: ', n);
			//console.log('O valor de a é: ', a);
			//console.log('O valor de b é: ', b);
			//console.log('O valor de server é: ', server);
		  
			/*
			if(process.argv.length > 1){
			 
			  c = Number(process.argv[2]);
			}
			*/
		  
			//console.log('Calculos do cliente \n');
		  
		  
		  
		  
			if (data == 0) {
			  client = (g * b) % n;
			} else {
			  client = server * ((g * b) % n);
			}
		  
			var num1 = (client * a) % n;
			var num2 = ((client / server) * a) % n;
		  
			//console.log('Calculos do servidor \n');
		  
			var key1 = crypto.createHash('sha256').update(num1.toString()).digest('hex');
			var key2 = crypto.createHash('sha256').update(num2.toString()).digest('hex');
		  
			//console.log('O valor da hash da  chave1 é: ', key1);
			//console.log('O valor da hash da chave2 é: ', key2);
		  
			var cipher1 = crypto.createCipher("aes-256-ecb", key1);
			var cipher2 = crypto.createCipher("aes-256-ecb", key2);
		  
			var encryptedInput1 = (
			  cipher1.update(input1, "utf8", "base64") +
			  cipher1.final("base64")
			);
		  
			var encryptedInput2 = (
			  cipher2.update(input2, "utf8", "base64") +
			  cipher2.final("base64")
			);
		  
			//console.log('O valor de cifra da chave1 é: ', encryptedInput1);
			//console.log('O valor de cifra da chave2 é: ', encryptedInput2);
		  
		  
			//console.log('Decifra do cliente \n');
		  
		  
		  
			var num3 = (server * b) % n;
			var key3 = crypto.createHash('sha256').update(num3.toString()).digest('hex');
		  
			socket.emit("chave", key3);
			//console.log('O valor da hash da chave3 é: ', key3);
		  
		  
			var decipher1 = crypto.createDecipher("aes-256-ecb", key3);
			var decipher2 = crypto.createDecipher("aes-256-ecb", key3);
			try {
			  // When decrypting we're converting the Base64 input to UTF-8 output.
			  var decryptedInput1 = (
				decipher1.update(encryptedInput1, "base64", "utf8") +
				decipher1.final("utf8")
			  );
				socket.emit("Resultado", decryptedInput1);
		
			  //console.log('Message1 é: ', decryptedInput1);
			} catch (error) {
			    // When decrypting we're converting the Base64 input to UTF-8 output.
				var decryptedInput2 = (
					decipher2.update(encryptedInput2, "base64", "utf8") +
					decipher2.final("utf8")
				  );
			  
				  socket.emit("Resultado", decryptedInput2);
				 // console.log('Message2 é: ', decryptedInput2);
			 
			}
		  
	
	
	});

	
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

app.get('/login', (req, res) => {
	res.render("login.ejs")
})

app.get('/raspadinhas', (req, res) => {
	res.render("raspadinhas.ejs")
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

