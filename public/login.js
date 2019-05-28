
function validate_username() {

    a = document.createElement("p") // Cria um novo elemento do tipo p
    a.innerHTML = "Clicked!"// diz o html a ser colocado dentro desse elento
    document.body.appendChild(a);   // faz append do elemento à página
    utilizador = document.getElementById("Username").value

    socket.emit("validate_username", utilizador)

    socket.on("existing_check", function (data) {
        if (data == 1) {
            login()
        }
        if (data == 0) {
            alert("ERROR: Username doesn't exist. Please register user first")
            location.reload()
        }
    })
}


function login() {
    utilizador = document.getElementById("Username").value

    socket.emit("login", utilizador)

    socket.on("receive_server_challenge", (data) => {
        print(data)

        key1 = localStorage.getItem("server_client_aes_key")

        let enc = new TextEncoder();
        key_to_encrypt = enc.encode(key1)

        window.crypto.subtle.importKey(
            "jwk", //can be "jwk" or "raw"
            key1,
            {   //this is the algorithm options
                name: "AES-CTR",
                hash: { name: "SHA-256" },
            },
            true, //whether the key is extractable (i.e. can be used in exportKey)
            ["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
        ).then(function (key) {
            //returns the symmetric key
            console.log(key);
            window.crypto.subtle.encrypt(
                {
                    name: "AES-CTR",
                    //Don't re-use counters!
                    //Always use a new counter every time your encrypt!
                    counter: new Uint8Array(16),
                    length: 128, //can be 1-128
                },
                key, //from generateKey or importKey above
                data //ArrayBuffer
            )
        }).then(function (encrypted) {
            //returns an ArrayBuffer containing the encrypted data
            console.log(new Uint8Array(encrypted));
        })

    })

}



function print(stuff) {
    console.log(stuff)
}