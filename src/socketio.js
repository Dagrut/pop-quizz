const socketio = require('socket.io');
const socketioStudent = require('./socketio-student.js');
const socketioAdmin = require('./socketio-admin.js');
const events = require('events');

const tools = require('./tools.js');

function loadIo() {
	/* Hash studentID => quizz mark + form data backup + quizz start time + socketIO client + IP address + session token */
	pq.studentData = {};
	/* Hash session token => student ID */
	pq.studentSessPool = {};
	/* Hash socketIO client ID => student ID */
	pq.ioStudents = {};
	pq.adminAccessUrl = '/' + tools.randomString(51, /[a-zA-Z0-9]/);
	pq.evts = new events.EventEmitter();
	
	pq.io.on('connection', function(client) {
		var clientUid = client.id;
		var clientIP = tools.objGet(client, 'handshake.address', 'NOIP');
		
		pq.log.ioconn("Connection from " + clientIP);
		
		client.on('ready', function(url, session) {
			if(url == pq.adminAccessUrl)
				socketioAdmin(client, session);
			else
				socketioStudent(client, session);
		});
	});
	
	console.log('Admin interface ready on http://127.0.0.1:'+pq.opts.port+pq.adminAccessUrl);
	
	var evtsPool = [];
	var evtsHash = {};
	
	setInterval(function() {
		if(evtsPool.length > 0) {
			pq.io.in('admin').emit('adminPush', evtsPool);
			evtsPool = [];
			evtsHash = {};
		}
	}, 2000);
	
	pq.evts.on('studentEvent', function(inWhat, hash) {
		try {
			var what = JSON.stringify(inWhat, function(k, v) {
				if(k == 'client')
					return('yes');
				else
					return(v);
			});
			what = JSON.parse(what);
		}
		catch(e) {
			console.log('Error when serializing what value : ', e);
			what = inWhat;
		}
		
		if(what.data && what.data.client == 'yes') {
			delete what.data.client;
			what.data.connected = true;
		}
		else {
			what.data.connected = false;
		}
		
		if(hash) {
			if(evtsHash.hasOwnProperty(hash)) {
				evtsPool[evtsHash[hash]] = what;
				return;
			}
			evtsHash[hash] = evtsPool.length;
		}
		
		evtsPool.push(what);
	});
}

module.exports = loadIo;
