const fs = require('fs');
const path = require('path');
const express = require('express');

function loadRoutes() {
	pq.app.use('/static', express.static(path.join(__dirname, '..', 'static')));
	pq.app.use('/fonts', express.static(path.join(__dirname, '..', 'data', 'fa', 'fonts')));
	pq.app.use('/jquery', express.static(path.join(__dirname, '..', 'node_modules', 'jquery', 'dist')));
	pq.app.use('/handlebars', express.static(path.join(__dirname, '..', 'node_modules', 'handlebars', 'dist')));
	pq.app.use('/showdown', express.static(path.join(__dirname, '..', 'node_modules', 'showdown', 'dist')));
	pq.app.use('/prismjs/js', express.static(path.join(__dirname, '..', 'node_modules', 'prismjs')));
	pq.app.use('/prismjs/css', express.static(path.join(__dirname, '..', 'node_modules', 'prismjs', 'themes')));
	
	pq.app.get(['/', '/*'], function(req, res) {
		pq.log.access("Access from " + req.client.remoteAddress);
		var fileStream = fs.createReadStream(path.join(__dirname, '..', 'static', 'main.html'));
		fileStream.pipe(res);
		fileStream.on('error', function() {
			res.end();
		});
	});
}

module.exports = loadRoutes;
