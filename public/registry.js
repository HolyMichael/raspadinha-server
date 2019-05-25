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

   ).then((key) => {
      //check JWK parameters here https://www.iana.org/assignments/jose/jose.xhtml ou no rfc7518
      //extrair a chave privada e meter no local storage
      sk = window.crypto.subtle.exportKey("jwk",key.privateKey).then ((sk)=>{
         print("client secret key - " + key_print(sk))
         // print("client secret key d (Private Exponent) value: " +  sk.d)

         localStorage.setItem('sk', key_print(sk));

      })
         //exporta a chave publica para ser processada
         return window.crypto.subtle.exportKey("jwk",key.publicKey)
      }
   //a chave publica é enviada para o servidor
   ).then((exportedKey) => {
      print("client public key: " + key_print(exportedKey))
      // window.location.replace(window.location + "/" + exportedKey.n + "/" + utilizador)
      socket.emit("send_public_key", exportedKey)
      
      // print("storage test: " + key_print(localStorage.getItem("sk")))

     
    })
    
};


function encrypt(text, publicKey){
      text = "ola"
      let enc = new TextEncoder();
      encoded_data = enc.encode(data);
      
      let ct = window.crypto.subtle.encrypt({name: "RSA-OAEP"}, publicKey, encoded_data );
      print("123" + ct)

      return ct
}

function decrypt(ct, privateKey){
   let encoded_ct = enc.encode(ct)
   let dec = window.crypto.subtle.decrypt({name:"RSA-OAEP"}, privateKey, encoded_ct);
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