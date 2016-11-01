const http = require('http');

const express = require('express');
const socketio = require('socket.io');

const argsParser = require('./src/args.js');
const logsLoader = require('./src/logs.js');
const loadExpress = require('./src/express.js');
const loadSocketIo = require('./src/socketio.js');
const loadShell = require('./src/shell.js');

function main() {
	global.pq = {};
	
	pq.STATES = {
		idle: 'idle',
		quizz: 'quizz',
		solve: 'solve',
	};
	
	pq.state = pq.STATES.idle;
	pq.opts = argsParser();
	
	pq.app = express();
	
	pq.server = http.createServer(pq.app);
	pq.io = socketio(pq.server);
	
	logsLoader();
	loadExpress();
	
	pq.server.listen(pq.opts.port);
	
	loadSocketIo();
	loadShell();
}

main();
