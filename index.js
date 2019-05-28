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

const server_inital_PK = {
	kty: "RSA",
	alg: "RSA-OAEP-256",
	key_ops: [
		"encrypt"
	],
	ext: true,
	n: "vDlw-L9xRWlK7jAYjRHJCOKt7OlO0tDQcceUiLfdQPTS41RWEuOiw46N-kVUfnCBsTJ0r4LnIho9nXUlhLIgJiQpzVYA6-2uASY9c7LhVLWoVs1jEj6f1kpFj3ekJNtQSCMV2mMrIyoBmiHtoPDdIwRbPwB1BDJt3ztajys5IM7kFRS9KWJxB7gOdFQESv-Qt_L5eap41I9_phCximuRCeOxG73qfYY_osbWuWCMBzWBd25xQKEy5AtYnldTkRrudu9cX4Y8cbPgHTD5WNc1p7yJhX0QzFxyUogBrQNnCCJv-8y7-SiV3pxZSXbxLQFcLegYnlTCmjRozbm-0rUeBw",
	e: "AQAB"
}
const server_inital_SK = {
	kty: "RSA",
	alg: "RSA-OAEP-256",
	key_ops: [
		"decrypt"
	],
	ext: true,
	n: "vDlw-L9xRWlK7jAYjRHJCOKt7OlO0tDQcceUiLfdQPTS41RWEuOiw46N-kVUfnCBsTJ0r4LnIho9nXUlhLIgJiQpzVYA6-2uASY9c7LhVLWoVs1jEj6f1kpFj3ekJNtQSCMV2mMrIyoBmiHtoPDdIwRbPwB1BDJt3ztajys5IM7kFRS9KWJxB7gOdFQESv-Qt_L5eap41I9_phCximuRCeOxG73qfYY_osbWuWCMBzWBd25xQKEy5AtYnldTkRrudu9cX4Y8cbPgHTD5WNc1p7yJhX0QzFxyUogBrQNnCCJv-8y7-SiV3pxZSXbxLQFcLegYnlTCmjRozbm-0rUeBw",
	e: "AQAB",
	d: "Mj5LD7taqyKeI9Km2xFCTqLjtnfY2KFw4s5Zsd0SrIItwQ0EJOqqyfTFpWbYVSAHHpvPVgJlXE8Q33Uj3LYHqubAWdV5TYEWj6v7f2TijVAobXNJ3Nbmp7cPtmpDYKtCVN84uCD8pNhTsScZXXquLOi-yqR-l-42Mf6P_-OTzlO2SIp52hHvNTalykM3F8GmKxl8nEDPnupwAPYRaKA5N8SijztXFzo4DB-Ib2GXQ85rj3Ob7pp3163Gt47s_83Mbf_bFyiFN5ZXrNGyUsxbiULQopZ54JrBhMrsiiG-MK0NSefp9XSd_885wBY2xyHDJTIke8u413vkW9b3ixReIQ",
	p: "61q9D_Af8lxmYChmK8GLXqkcUTfiQe86g5GMpzP2Igr_YKWu84OKRC6fen1mL50FOBBX0IUj1yx1PBa6WyZ1WZsVeD_OKy3JFwu_tj3QEzBiqYZA07okeV3zcqgl10Ngn7x3WL9UOIeqCXeUHNjkc_qlTf-uWa9UNiR2X4t_vyk",
	q: "zLxSUKTC3wd7yBjQWp2FM2wtNFzc2YIdigjlSjBFO5pGANs8juximoQNTejFYMFSVW7xs6LIRpWGY6EjrdVI44-qHHLI8vjh7aKWaiuGS64TV7VgwdctbzsMl9edQcPy3aNDa2aSFRochYGE1wBfInUI4F27gIw3CTGKgB2BCa8",
	dp: "0edhi19r_qnuHICrbwb1F_3XZZBj2M5V75XWTiGHuaD5Vuct-70ridfTIFnK01hFmVTqHO1Bo9zgyjCzECxiqQIpyc-OPvBc0pMF7rF-bD7RH8S--JahhSUHxRC2fyB2gsCB6MLriGdmfX8KuBew2MeIuuH4S8CVaJxofppZ2tE",
	dq: "ZJHpmYWl2Crz6hIOX0TbhqwP9JXdQtdArWq7P1tA1wtsccVAFTEXKrHNW0UJmAK-8AqknkpLOSkAL_aa8SxBNs9-j6TvAzOwv6vLWXHx8UEcbUxCsFWEEwydngUjUYfwyGEHoD1tawI9mnNKDtc25FU7PAOvNHEsI877Kv3TQi8",
	qi: "L9QWAma3OJSydIfgYTSyCb9EuRfWkpGyoabP_LvAU1sao1Xm-thx-axI-kzosNFG_hHCODeMLhmzWun8r-EjKaSytD29J4sHLuU2sDEMntkDyVRwsFjp0cD16H1H3Gax1PU_cmNfKaimyvElhDRES_VP4nc9Zjifjzm0hLHT0Sc",
}


app.use(express.static(__dirname + "/public"))  // define a pasta "root" onde são procurados ficheiros estáticos ex scripts de javascript

io.on('connection', function (socket) {
	console.log("User connected")

	socket.on("enter_page", (data) => {
		crypto.subtle.importKey(
			"jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
			server_inital_SK,
			{   //these are the algorithm options
				name: "RSA-OAEP",
				hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
			},
			true, //whether the key is extractable (i.e. can be used in exportKey)
			["decrypt"] //"encrypt" or "wrapKey" for public key import or
			//"decrypt" or "unwrapKey" for private key imports
		).then(function (private_key) {
			// console.log(private_key);

			crypto.subtle.importKey(
				"jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
				server_inital_PK,
				{   //these are the algorithm options
					name: "RSA-OAEP",
					hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
				},
				true, //whether the key is extractable (i.e. can be used in exportKey)
				["encrypt"] //"encrypt" or "wrapKey" for public key import or
				//"decrypt" or "unwrapKey" for private key imports
			).then(function (public_Key) {
				console.log("entered");
				// print(key_print(public_Key))

				socket.emit("init_server_public_key", public_Key)
			})

		})
	})

	var id = ""
	var client_publicKey
	var server_publicKey
	var server_privateKey
	var aes_client_server
	var aes_server_client

	socket.on("first_register_connection", (cipheredKey) => {
		print(cipheredKey)

		crypto.subtle.importKey(
			"jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
			server_inital_SK,
			{   //these are the algorithm options
				name: "RSA-OAEP",
				hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
			},
			true, //whether the key is extractable (i.e. can be used in exportKey)
			["decrypt"] //"encrypt" or "wrapKey" for public key import or
			//"decrypt" or "unwrapKey" for private key imports
		).then(function (privateKey) {
			// print(privateKey)
			crypto.subtle.decrypt(
				{
					name: "RSA-OAEP",
					//label: Uint8Array([...]) //optional
				},
				privateKey, //from generateKey or importKey above
				cipheredKey //ArrayBuffer of the data
			)
				.then(function (decrypted) {
					//returns an ArrayBuffer containing the decrypted data
					let dec = new util.TextDecoder();
					dec_key = dec.decode(decrypted)
					print(dec_key)
				})
		})

	})



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
								// print("------- about to send:")
								socket.emit("encrypted_server_aes_key", encrypted)
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

		crypto_server.randomBytes(256, (err, buf) => {
			if (err) throw err;
			nonce = buf.toString('base64')
			console.log(`${buf.length} bytes of random data: ${buf.toString('base64')}`);

			socket.emit("receive_server_challenge", nonce)
			//a nonce deve ser cifrada antes de ser enviada


		});

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

app.get('/login', (req, res) => {
	res.render("login.ejs")
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

