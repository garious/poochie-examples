all: bundle.js

files = index.js $(wildcard */*.js)

node_modules/.exists:
	npm install
	@touch $@

bundle.js: $(files) node_modules/.exists
	browserify $(addprefix -r ./,$(files)) -r yoinkjs/yoink:yoink  -o $@ || rm -f $@

clean:
	rm -f bundle.js
	rm -rf node_modules
