## liza Makefile.am for automake
#
#  Copyright (C) 2010-2019 R-T Specialty, LLC.
#
#  This file is part of liza.
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.
##

path_src  = $(top_builddir)/src
path_test = $(top_builddir)/test

namespaces=$(shell find src -type d)
nsindex=$(addsuffix /index.js, $(namespaces))

SUBDIRS = doc
EXTRA_DIST = $(path_src) package.json index.js $(path_src)/version.js \
			 tools autogen.sh README.md $(path_test) \
			 bin/server bin/server.js tsconfig.json \
			 bin/delta-processor bin/delta-processor.js

.PHONY: FORCE todo

all-am: modindex

dist-hook: check

# used to force typescript compilation (it handles its own incremental
# compilation and dependency discovery)
.PHONY: tsc
tsc: FORCE $(path_src)/.gitignore $(path_test)/.gitignore
	node_modules/.bin/tsc

modindex: $(nsindex)
%/index.js: FORCE tsc
	./tools/gen-index "$*" > "$@"

# ignore compiled JS files (this can be removed once all files are TS)
%/.gitignore: FORCE
	@echo "# THIS FILE IS GENERATED; DO NOT MODIFY!" > $@
	( cd $*/ && find . -name '*.ts' -printf "%P\n" | sed 's/\.ts$$/.js/' ) >> $@

# ignore style checks for generated js files
.INTERMEDIATE: .prettiertmp
.prettiertmp: .prettierignore .gitignore $(path_src)/.gitignore $(path_test)/.gitignore
	grep -Pv '^#' $^ | sed -E 's#/?.(git|prettier)ignore:#/#;s#^./##;s#^/##' > .prettiertmp

# ignore linting for generated js files and unit tests
.INTERMEDIATE: .eslinttmp
.eslinttmp: .eslintignore .prettiertmp
	sed -n 'p' $^ > $@

# tsc handles its own incremental builds, and in the past has gotten into
# states where it did not recognize missing files as needing to be
# built.  Since those files are not part of _our_ dependency graph here, we
# need to double-check.
check-ts-out:
	find $(path_src) $(path_test) -name '*.ts' -a ! -name '*.d.ts' \
	  | while read f; do \
	      test -f "$${f%%.ts}.js" || { \
	        echo "error: missing tsc output for $$f" >&2; \
	        exit 1; \
	      }; \
	    done

.PHONY: check-lint
check-lint: .eslinttmp tsc
	npx eslint --quiet --ignore-path .eslinttmp --ext .js,.ts .

.PHONY: check-format
check-format: .prettiertmp tsc
	npx prettier --ignore-path .prettiertmp --check "./**/*.[j,t]s"

.PHONY: fix fmt fix-lint format
fix: fix-lint fmt
fmt: format
fix-lint: .eslinttmp tsc
	npx eslint --ignore-path .eslinttmp --ext .js,.ts . --fix
format: .prettiertmp tsc
	npx prettier --ignore-path .prettiertmp --write './**/*.[j,t]s'

.PHONY: test
test: tsc
	PATH="$(PATH):$(CURDIR)/node_modules/.bin" \
		@CODE_COV@ mocha @NODE_DESTRUCTURE@ \
		      --require $(path_test)/pre.js \
		      --recursive \
		      @COV_ARGS@ \
		      $(TESTARGS)

check-local: test check-ts-out check-format check-lint

FORCE:
