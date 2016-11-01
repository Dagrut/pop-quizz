const path = require('path');
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
					filename: path.join(pq.opts.logDir, 'filelog-' + type + '.log'),
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

module.exports = loadLogs;
