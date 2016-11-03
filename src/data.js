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

function loadSaves(endCb) {
	var stateFile = path.join(pq.opts.dataDir, "state.json");
	
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

function runAutoSaver() {
	var stateFile = path.join(pq.opts.dataDir, "state.json");
	var summaryFile = path.join(pq.opts.dataDir, "summary.txt");
	
	function prepareSavedState() {
		var studentData = tools.objMerge(pq.savedState.studentData || {}, pq.studentData);
		
		pq.savedState.studentData = tools.objMap(studentData, function(val) {
			var cpy = {form: true, start: true, mark: true, blurTotal: true, blurCount: true, discTotal: true, discCount: true};
			for(var i in cpy)
				cpy[i] = val[i];
			return(cpy);
		});
		
		pq.savedState.state = pq.state;
		
		pq.savedState.saveTime = Date.now();
	}
	
	function prepareSummary() {
		var tf = tools.tableFormatter(6);
		
		tf.addSeparator();
		tf.add(
			"ID",
			"Student",
			"Status",
			"Mark",
			"Time left",
			"Away duration",
			"Disc. duration",
			"Away count",
			"Disc. count"
		);
		tf.addSeparator();
		
		var studentData = tools.objMerge(pq.savedState.studentData || {}, pq.studentData);
		
		for(var id = 0 ; id < pq.opts.students.length ; id++) {
			var status = "Waiting";
			var awayDur = 0;
			var discDur = 0;
			var awayCount = 0;
			var discCount = 0;
			var tleft = pq.opts.quizz.duration / 1000;
			var mark = '';
			
			if(studentData.hasOwnProperty(id)) {
				if(studentData[id].mark !== undefined) {
					mark = studentData[id].mark;
					status = "Ended";
				}
				else {
					status = "Started";
				}
				
				awayDur = studentData[id].blurTotal || 0;
				discDur = studentData[id].discTotal || 0;
				awayCount = studentData[id].blurCount || 0;
				discCount = studentData[id].discCount || 0;
				
				tleft = pq.opts.quizz.duration - (Date.now() - studentData[id].start);
				
				tleft /= 1000;
				if(tleft < 0)
					tleft = 0;
			}
			
			tf.add(
				id,
				pq.opts.students[id],
				status,
				mark,
				tools.secondsToMMSS(tleft),
				awayDur > 0 ? tools.secondsToMMSS(awayDur) : '',
				discDur > 0 ? tools.secondsToMMSS(discDur) : '',
				awayCount || '',
				discCount || ''
			);
		}
		
		tf.addSeparator();
		
		var ret = "File write date : " + (new Date()).toString() + "\n\n";
		ret += tf.render();
		ret += '\n';
		return(ret);
	}
	
	setInterval(function() {
		prepareSavedState();
		
		fs.writeFile(stateFile, JSON.stringify(pq.savedState), function(err) {
			if(err)
				console.console.error("Could not save state file '" + stateFile + "' : " + err);
		});
		fs.writeFile(summaryFile, prepareSummary(), function(err) {
			if(err)
				console.console.error("Could not save state file '" + summaryFile + "' : " + err);
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
		
		try {
			fs.writeFileSync(summaryFile, prepareSummary());
		}
		catch(e) {
			console.error('Could not save summary file :', e);
		}
	});
}

function loadData(endCb) {
	loadLogs();
	loadSaves(endCb);
	runAutoSaver();
}

module.exports = loadData;
