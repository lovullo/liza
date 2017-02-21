## For use my automake and autoconf
#
#  Copyright (C) 2014--2017 LoVullo Associates, Inc.
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

AC_INIT([liza], [0.11.2], [dev@lovullo.com])
AC_CONFIG_AUX_DIR([build-aux])
AM_INIT_AUTOMAKE([foreign])

# provide more granular version numbers based on the above AC_INIT line
m4_define([ver_split], m4_split(m4_translit(AC_PACKAGE_VERSION, [-], [.]), [\.]))
AC_SUBST(MAJOR, m4_argn(1, ver_split))
AC_SUBST(MINOR, m4_argn(2, ver_split))
AC_SUBST(REV, m4_argn(3, ver_split))
AC_SUBST(SUFFIX, m4_argn(4, ver_split))

AC_ARG_VAR([NODE], [The node.js interpreter])
AC_CHECK_PROGS(NODE, [node nodejs])

test -n "$NODE" || AC_MSG_ERROR([missing Node.js])

# only needed for older versions of Node
AC_MSG_CHECKING([node --harmony_destructuring])
AS_IF([node --harmony_destructuring >/dev/null 2>/dev/null],
      [AC_MSG_RESULT(available)
       AC_SUBST([NODE_DESTRUCTURE], [--harmony_destructuring])],
      [AC_MSG_RESULT(no)])

# generate files from their *.in counterparts
AC_CONFIG_FILES([Makefile doc/Makefile package.json src/version.js])
AC_OUTPUT
