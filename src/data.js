const path = require('path');
const fs = require('fs');
const winston = require('winston');

const tools = require('./tools.js');

function loadLogs() {
	pq.log = {};
	
	function timestamp() {
		var d = new Date();
		var ret = tools.padString(d.getFullYear(), 4, '0') + '/' +
				tools.padString((d.getMonth() + 1), 2, '0') + '/' +
				tools.padString(d.getDate(), 2, '0') + 'T' +
				tools.padString(d.getHours(), 2, '0') + ':' +
				tools.padString(d.getMinutes(), 2, '0') + ':' +
				tools.padString(d.getSeconds(), 2, '0');
		
		return(ret);
	}
	
	function formatter(options) {
		return options.timestamp()+'|'+ options.level +'|'+ (undefined !== options.message ? options.message : '') +
		(options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
	}
	
	var list = ["access", "ioconn", "studLogs", "studResults"];
	for(var i = 0 ; i < list.length ; i++) {
		var type = list[i];
		
		var opts = {
			levels: {},
			level: type,
			transports: [
				new (winston.transports.File)({
					name: type +'-file',
					filename: path.join(pq.opts.dataDir, 'filelog-' + type + '.log'),
					level: type,
					timestamp: timestamp,
					formatter: formatter,
					json: false,
				}),
			],
		};
		opts.levels[type] = 0;
		
		var curLogger = new (winston.Logger)(opts);
		
		pq.log[type] = (function(type, str) {
			this[type](str);
		}).bind(curLogger, type);
	}
}

function loadSaves(stateFile, endCb) {
	pq.savedState = {
		studentData: {},
	};
	
	fs.readFile(stateFile, function(err, data) {
		if(err || !data)
			return(endCb());
		
		try {
			pq.savedState = JSON.parse(data);
			pq.state = pq.savedState.state;
			
			var sd = pq.savedState.studentData;
			for(var i in sd)
				sd[i].start += (Date.now() - pq.savedState.saveTime);
			
			console.info('# Loaded previous state');
		}
		catch(e) {}
		
		endCb();
	});
}

function runAutoSaver(stateFile) {
	function prepareSavedState() {
		pq.savedState.studentData = tools.objMap(pq.studentData, function(val) {
			return({
				form: val.form,
				start: val.start,
				mark: val.mark,
			});
		});
		
		pq.savedState.state = pq.state;
		
		pq.savedState.saveTime = Date.now();
	}
	
	setInterval(function() {
		prepareSavedState();
		
		fs.writeFile(stateFile, JSON.stringify(pq.savedState), function(err) {
			if(err)
				console.console.error("Could not save state file '" + stateFile + "' : " + err);
		});
	}, 10000);
	
	process.on('exit', function() {
		prepareSavedState();
		
		try {
			fs.writeFileSync(stateFile, JSON.stringify(pq.savedState));
		}
		catch(e) {
			console.error('Could not save state file :', e);
		}
	});
}

function loadData(endCb) {
	var stateFile = path.join(pq.opts.dataDir, "state.json");
	loadLogs();
	loadSaves(stateFile, endCb);
	runAutoSaver(stateFile);
}

module.exports = loadData;
