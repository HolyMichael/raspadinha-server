const fs= require('fs');
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
      modulusLength: 4096,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256', 
      },
      true,
      ["encrypt", "decrypt"]

   ).then((key) => {

      sk= window.crypto.subtle.exportKey("jwk",key.privateKey

       ).then ((sk)=>{
        
         localStorage.setItem('sk', sk.n);

       })

         return window.crypto.subtle.exportKey(
            "jwk",
           key.publicKey
         )
            
      }
        
   ).then((exportedKey) => {
      window.location.replace(window.location + "/" + exportedKey.n + "/" + utilizador)
     
    })
    

    
};