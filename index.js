console.log("I'm alive");

const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

/*an object
function player(id, name, gameState, activedeck, sock){
	this.id = id; //primary key id in database possibly unique repeated with name might remove
	this.name = name;
	this.gameState = gameState;
	this.activedeck = activedeck;
	this.sock = sock; //primary key current connection id
	this.connectionStatus = true;
	this.currentTimeout; //mantains the timeout object so we can delete it in case the user responds
	this.currentPromise;
	this.currentGame;
}

An object function
player.prototype.ping = function(){
	io.to(this.sock).emit('ping');
	console.log("pinging " + this.sock);
	this.connectionStatus = false;
	this.currentTimeout = setTimeout(this.pingFailCheck.bind(this),5000); //bind(this) used because this function is called from setTimeout wich rebinds this to the timeout obj
	this.currentPromise = new deferred();
	return this.currentPromise.promise;
}*/

