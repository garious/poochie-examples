all: bundle.js

files = index.js $(wildcard */*.js)

node_modules/.exists:
	npm install
	@touch $@

bundle.js: $(files) node_modules/.exists
	node_modules/.bin/browserify $(addprefix -r ./,$(files)) -r poochie/dom -o $@ || rm -f $@

clean:
	rm -f bundle.js
	rm -rf node_modules
