## liza documentation Makefile.am for automake
#
#  Copyright (C) 2014 R-T Specialty, LLC.
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

MAKEINFOHTML = $(MAKEINFO) --html --css-include liza.css

info_TEXINFOS = liza.texi
liza_TEXINFOS = license.texi macros.texi config.texi liza.css \
                design.texi assert.texi bucket.texi client.texi \
                dapi.texi pred.texi program.texi server.texi \
                validation.texi \
                diagram/event-graph.svg

diagram/%.svg: diagram/%.dot
if HAS_TWOPI
	$(TWOPI) -Tsvg "$<" > "$@"
else
	@echo "cannot build $<;" >&2
	@echo "install graphviz package and re-configure" >&2
endif

