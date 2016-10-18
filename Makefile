all: build
	
build:
	find ./templates -name "*.less" -type f | sort | xargs cat | node_modules/less/bin/lessc - static/style.css
	find ./templates -name '*.html' -type f | sort | xargs cat > static/main.html
	find ./templates -name '*.js' -type f | sort | xargs cat > static/script.js
	mkdir -p ./logs

demo: build
	node pop-quizz.js -q ./demo/quizz1.js -s ./demo/students -l ./logs -r
