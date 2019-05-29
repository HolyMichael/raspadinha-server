function getRandom() {

  raspClient(Math.random());
}
function submitPoll(id) {

  document.getElementById(id).disabled = true;
  setTimeout(function () { document.getElementById(id).disabled = false; }, 5000);


}

function raspClient(c) {

  if (c >= 0.5) {
    c = 1;
  } else {
    c = 0;
  }
  socket.emit("raspServer", c);
  console.log('O valor de c antes da normalização é: ', c);
  socket.on("chave", function (data) {

  });

  socket.on("Resultado", function (data) {
    a = document.createElement("p"); // Cria um novo elemento do tipo p
    a.innerHTML = data; // diz o html a ser colocado dentro desse elento
    document.body.appendChild(a);   // faz append do elemento à página

  });

}

