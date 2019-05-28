
function login() {
    a = document.createElement("p") // Cria um novo elemento do tipo p
    a.innerHTML = "Clicked!"// diz o html a ser colocado dentro desse elento
    document.body.appendChild(a);   // faz append do elemento à página
    utilizador = document.getElementById("Username").value


    socket.emit("login", utilizador)
 
}



function print(stuff){
    console.log(stuff)
}