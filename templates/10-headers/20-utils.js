function temporiseCb(cb, delay) {
	var timeout, context, args;
	var previous = 0;
	
	var later = function() {
		previous = Date.now();
		timeout = null;
		cb.apply(context, args);
		if(!timeout)
			context = args = null;
	};
	
	var throttled = function() {
		var now = Date.now();
		var remaining = delay - (now - previous);
		context = this;
		args = arguments;
		if(remaining <= 0 || remaining > delay) {
			if(timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			previous = now;
			cb.apply(context, args);
			if(!timeout)
				context = args = null;
		}
		else if(!timeout) {
			timeout = setTimeout(later, remaining);
		}
	};
	
	return throttled;
}

function objGet(obj, path, dft) {
	if(!(path instanceof Array))
		path = path.split('.');
	
	for(var i = 0 ; i < path.length ; i++) {
		var cur = path[i];
		
		try {
			if(!obj.hasOwnProperty(cur))
				return(dft);
			obj = obj[cur];	
		}
		catch(e) {
			return(dft);
		}
	}
	
	return(obj);
}

function arrayShuffle(arr) {
	var ret = [];
	var groups = {};
	
	for(var i = 0 ; i < arr.length ; i++) {
		var cur = arr[i];
		var grp = 'nogrp-' + i;
		
		if(cur.grp)
			grp = 'grp-' + cur.grp;
		
		if(groups.hasOwnProperty(grp))
			groups[grp].push(cur);
		else
			groups[grp] = [cur];
	}
	
	var keys = Object.keys(groups);
	
	while(keys.length > 0) {
		var i = (Math.random() * keys.length) | 0;
		i = keys.splice(i, 1)[0];
		ret = ret.concat(groups[i]);
	}
	
	return(ret);
}
