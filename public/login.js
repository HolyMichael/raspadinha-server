
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

        print(localStorage.getItem("rsa_sk"))
        client_sk = localStorage.getItem("rsa_sk")

        jason_fake = JSON.parse(localStorage.getItem("ignore"))
        jason_fake.d = client_sk
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
                socket.emit("reply_to_challenge", signature)
            })

        })

    })
}



function print(stuff) {
    console.log(stuff)
}