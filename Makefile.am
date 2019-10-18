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

tsout = tsconfig.tsbuildinfo

SUBDIRS = doc
EXTRA_DIST = $(path_src) package.json index.js $(path_src)/version.js \
			 tools autogen.sh README.md $(path_test) \
			 bin/server bin/server.js

.PHONY: FORCE todo

all-am: modindex

dist-hook: check

# used to force typescript compilation (it handles its own incremental
# compilation and dependency discovery)
$(tsout): FORCE $(path_src)/.gitignore $(path_test)/.gitignore
	node_modules/.bin/tsc

modindex: $(nsindex)
%/index.js: FORCE $(tsout)
	./tools/gen-index "$*" > "$@"

# ignore compiled JS files (this can be removed once all files are TS)
%/.gitignore: FORCE
	@echo "# THIS FILE IS GENERATED; DO NOT MODIFY!" > $@
	( cd $*/ && find . -name '*.ts' -printf "%P\n" | sed 's/\.ts$$/.js/' ) >> $@

test: check
check: $(tsout)
	PATH="$(PATH):$(CURDIR)/node_modules/mocha/bin" \
		mocha @NODE_DESTRUCTURE@ \
		      --require $(path_test)/pre.js \
		      --recursive \
		      $(TESTARGS)

FORCE:
