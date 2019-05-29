function getRandom(){
  
  raspClient(Math.random());
}

function raspClient(c) {
  if (c >= 0.5) {
    c = 1;
  } else {
    c = 0;
  }
  socket.emit("raspServer", c);
  console.log('O valor de c antes da normalização é: ', c);
}

