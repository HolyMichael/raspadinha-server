// const fs= require('fs');

var client_publicKey
var server_publicKey

function validate_username(){
   a = document.createElement("p") // Cria um novo elemento do tipo p
   a.innerHTML = "Clicked!"// diz o html a ser colocado dentro desse elento
   document.body.appendChild(a);   // faz append do elemento à página
   utilizador = document.getElementById("User").value

   socket.emit("validate_username", utilizador)

   socket.on("existing_check", function (data) {
      if(data == 1){
         alert("ERROR: Username already exists. Please enter a new one")
         location.reload()
      }
      if(data == 0){
         register()
      }
   })

}

function register() {
   utilizador = document.getElementById("User").value

   socket.emit("get_username", utilizador)

   var client_privateKey

   window.crypto.subtle.generateKey({
      name: "RSA-OAEP",
      modulusLength: 1024,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
   },
      true,
      ["encrypt", "decrypt"]
   ).then(function (key) {
      //returns a keypair object
      // console.log(key);
      client_privateKey = key.privateKey
      localStorage.setItem('rsa_sk', client_privateKey);
      //---------------------------------- send client public key
      server_publicKey = window.crypto.subtle.exportKey("jwk", key.publicKey).then(function (pubkey) {
         //returns the exported key data
         //print(keydata + key_print(keydata));
         socket.emit("send_client_public_key", pubkey)
      })
      // -------------- RECEIVE SERVER PUBLIC KEY
      socket.on("send_server_public_key", (data) => {
         print("----- client received server public key ----- ")
         print(data)
         server_publicKey = data

         // -------------- GENERATE SIMMETRIC KEY: CLIENT ===> SERVER
         window.crypto.subtle.generateKey(
            {
               name: "AES-CTR",
               length: 256, //can be  128, 192, or 256
            },
            true, //whether the key is extractable (i.e. can be used in exportKey)
            ["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
            //key IS THE GENERATED SYMMETRIC KEY
         ).then(function (key) {
            //E PRECISO EXPORTAR A CHAVE SIMETRICA PRIMEIRO
            window.crypto.subtle.exportKey(
               "jwk", //can be "jwk" or "raw"
               key //extractable must be true
               //KEYDATA CORRESPONDE A CHAVE SIMETRICA EXPORTADA
            ).then(function (keydata) {
               localStorage.setItem('client_server_aes_key', key);
               print("----- client exported simmetric key ----- ")
               console.log(keydata);
               //PRIMEIRO TENHO QUE IMPORTAR A CHAVE PUBLICA DO SERVIDOR PARA A USAR 
               window.crypto.subtle.importKey(
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
                  print("----- client imported server public key ----- ")
                  console.log(publicKey);
                  console.log(key_print(keydata))

                  //É PRECISO FAZER ENCODE DA CHAVE SIMETRICA QUE FOI GERADA
                  let enc = new TextEncoder();
                  key_to_encrypt = enc.encode(keydata.k)
                  print("about to send:  " + key_to_encrypt)
                  // key_to_encrypt = from(JSON.stringify(keydata));

                  window.crypto.subtle.encrypt(
                     {
                        name: "RSA-OAEP",
                        //label: Uint8Array([...]) //optional
                     },
                     publicKey, //from generateKey or importKey above
                     key_to_encrypt //ArrayBuffer of data you want to encrypt
                     //SEND THE ENCRYPTED KEY TO THE SERVER
                  ).then(function (encrypted) {
                     print("SEND THE ENCRYPTED KEY TO THE SERVER")
                     print(encrypted)
                     print(encrypted.byteLength)

                     socket.emit("encrypted_client_aes_key", encrypted)
                  })
                     .catch(function (err) {
                        console.error(err);
                     });

               })
                  .catch(function (err) {
                     console.error(err);
                  });
            })
         })
      })

      socket.on("encrypted_server_aes_key", (cipheredKey) => {
         print("------ RECEIVED CIPHERED KEY FROM SERVER ")
         console.log(cipheredKey);
         window.crypto.subtle.decrypt(
            {
               name: "RSA-OAEP",
               //label: Uint8Array([...]) //optional
            },
            client_privateKey, //from generateKey or importKey above
            cipheredKey //ArrayBuffer of the data
         ).then((decrypted_key) => {
            print(decrypted_key.byteLength)
            let dec = new TextDecoder();
            dec_key = dec.decode(decrypted_key)

            print("----- decrypted key -----")
            print(key_print(dec_key))

            let json_key = {
               alg: "A256CTR",
               ext: true,
               k: dec_key,
               key_ops: ["encrypt", "decrypt"],
               kty: "oct"
            }
            print(key_print(json_key))

            window.crypto.subtle.importKey("jwk",
               json_key,
               {   //this is the algorithm options
                  name: "AES-CTR",
               },
               true, //whether the key is extractable (i.e. can be used in exportKey)
               ["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
            )
               .then((imported_aes_key) => {
                  print("cheguei chegando")
                  print(imported_aes_key)
                  localStorage.setItem('server_client_aes_key', imported_aes_key);
               })
         }).catch(function (err) {
            console.error(err);
         });
      })

   })
};

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





//  .then((key) => {
//    //check JWK parameters here https://www.iana.org/assignments/jose/jose.xhtml ou no rfc7518
//    //extrair a chave privada e meter no local storage
//    sk = window.crypto.subtle.exportKey("jwk",key.privateKey).then ((sk)=>{
//       print("client secret key - " + sk + key_print(sk))
//       localStorage.setItem('sk', key_print(sk));
//    })
//       //exporta a chave publica para ser processada
//    return window.crypto.subtle.exportKey("jwk",key.publicKey)
//    }
// //a chave publica é enviada para o servidor
// ).then((exportedKey) => {
//    print("client public key: " + key_print(exportedKey))
//    // window.location.replace(window.location + "/" + exportedKey.n + "/" + utilizador)
//    socket.emit("send_public_key", exportedKey)

//    // print("storage test: " + key_print(localStorage.getItem("sk")))
//  })