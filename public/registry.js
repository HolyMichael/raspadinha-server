// const fs= require('fs');

function arrayBufferToString(buffer)
{
    var str = "";
    for (var iii = 0; iii < buffer.byteLength; iii++)
    {
        str += String.fromCharCode(buffer[iii]);
    }

    return str;
}

var client_publicKey
var server_publicKey
var client_privateKey

function register() {
   a = document.createElement("p") // Cria um novo elemento do tipo p
   a.innerHTML = "Clicked!"// diz o html a ser colocado dentro desse elento
   document.body.appendChild(a);   // faz append do elemento à página
   utilizador= document.getElementById("User").value

   window.crypto.subtle.generateKey({
      name: "RSA-OAEP",
      modulusLength: 1024,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256', 
      },
      true,
      ["encrypt", "decrypt"]
   ).then(function(key){
      //returns a keypair object
      // console.log(key);
      //---------------------------------- send client public key
      server_publicKey = window.crypto.subtle.exportKey("jwk", key.publicKey).then(function(pubkey){
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
         ).then(function(key){
               //E PRECISO EXPORTAR A CHAVE SIMETRICA PRIMEIRO
               window.crypto.subtle.exportKey(
                  "jwk", //can be "jwk" or "raw"
                  key //extractable must be true
               //KEYDATA CORRESPONDE A CHAVE SIMETRICA EXPORTADA
              ).then(function(keydata){
                  print("----- client exported simmetric key ----- ")
                  console.log(keydata);
                  //PRIMEIRO TENHO QUE IMPORTAR A CHAVE PUBLICA DO SERVIDOR PARA A USAR 
                  window.crypto.subtle.importKey(
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
                     print("----- client imported server public key ----- ")
                     console.log(publicKey);
                     console.log(key_print(keydata))
   
                     //É PRECISO FAZER ENCODE DA CHAVE SIMETRICA QUE FOI GERADA

                     //TODO: fix this fuckin garbage
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
                     ).then(function(encrypted){
                        print("SEND THE ENCRYPTED KEY TO THE SERVER")
                        print(encrypted)
                        print(encrypted.byteLength)
                        //returns an ArrayBuffer containing the encrypted data
                        // // console.log(new Uint8Array(encrypted));
                        // socket.emit("first_half", encrypted.slice(0, encrypted.byteLength/2))
                        // socket.emit("second_half", encrypted.slice( encrypted.byteLength/2, 128))

                        //alternativa, passar diretamente o valor da string da chave
                        //e fazer rebuild do json na outra parte

                        socket.emit("encrypted_client_aes_key", encrypted)
                        // socket.emit("teste", "123")
                  })
                  .catch(function(err){
                      console.error(err);
                  });

              })
              .catch(function(err){
                  console.error(err);
              });
 //returns the exported key data
            })

               //ENCRYPT THIS AES KEY WITH THE RECEIVED RSA PUBLIC KEY
               

         })
      })
   


      
   })
   .catch(function(err){
      console.error(err);
   });

};

function print(stuff){
   console.log(stuff)
}

/**
 * retorna uma string com os valores da chave recebida
 * @param {*} key chave a imprimir
 * @returns string da chave
 */
function key_print(key){
	return JSON.stringify(key, null, "")
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