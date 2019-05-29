
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

        print("receive_server_challenge: " + data)

        print(localStorage.getItem("client_secret_key"))
        client_sk = localStorage.getItem("client_secret_key")

        jason_fake = JSON.parse(localStorage.getItem("client_secret_key"))
        jason_fake.alg = "PS256"
        jason_fake.key_ops = "sign"

        window.crypto.subtle.importKey(
            "jwk", //can be "jwk" or "raw"
            jason_fake,
            {   //these are the algorithm options
                name: "RSA-PSS",
                hash: { name: "SHA-256" }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
            },
            true,
            ["sign"]
        ).then(function (key) {
            //returns the symmetric key
            console.log(key);

            let enc = new TextEncoder();
            data_to_encrypt = enc.encode(data)

            window.crypto.subtle.sign(
                {
                    name: "RSA-PSS",
                    saltLength: 64,
                    //label: Uint8Array([...]) //optional
                },
                key, //from generateKey or importKey above
                data_to_encrypt //ArrayBuffer
            ).then(function (signature) {
                //returns an ArrayBuffer containing the encrypted data
                print(signature)


                let json_key = {
                    alg: "A256CTR",
                    ext: true,
                    k: localStorage.getItem("client_server_aes_key"),
                    key_ops: ["encrypt", "decrypt"],
                    kty: "oct"
                }

                window.crypto.subtle.importKey(
                    "jwk", //can be "jwk" or "raw"
                    json_key,
                    {   //this is the algorithm options
                        name: "AES-CTR",
                    },
                    true, //whether the key is extractable (i.e. can be used in exportKey)
                    ["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
                )
                    .then(function (key) {
                        window.crypto.subtle.encrypt(
                            {
                                name: "AES-CTR",
                                //Don't re-use counters!
                                //Always use a new counter every time your encrypt!
                                counter: new Uint8Array(16),
                                length: 128, //can be 1-128
                            },
                            key, //from generateKey or importKey above
                            signature //ArrayBuffer of data you want to encrypt
                        )
                            .then(function (encrypted_signature) {
                                socket.emit("reply_to_challenge", encrypted_signature)
                            })

                    })


            })

        })

    })

    socket.on("validation_result", (result) =>{
        if(result == true){
            print("authentication successfull")
            location.replace("/raspadinhas")

        }

        if (result == false){
            alert("ERROR SIGNING IN")
            location.reload()
        }

    })
}



function print(stuff) {
    console.log(stuff)
}