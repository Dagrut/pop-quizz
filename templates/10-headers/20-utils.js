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
	while(arr.length > 0) {
		var i = (Math.random() * arr.length) | 0;
		ret.push(arr.splice(i, 1)[0]);
	}
	return(ret);
}
