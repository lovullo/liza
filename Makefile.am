## liza Makefile.am for automake
#
#  Copyright (C) 2014 LoVullo Associates, Inc.
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

path_src = $(top_builddir)/src

namespaces=$(shell find src -type d)
nsindex=$(addsuffix /index.js, $(namespaces))

SUBDIRS = doc
EXTRA_DIST = package.json $(path_src)/version.js

.PHONY: FORCE todo

all-am: modindex

modindex: $(nsindex)
%/index.js: FORCE
	./tools/gen-index "$*" > "$@"

test: check
check:
	@PATH="$(PATH):$(CURDIR)/node_modules/mocha/bin" \
		mocha --recursive $(TESTARGS)

FORCE:
