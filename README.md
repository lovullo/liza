# Liza Data Collection Framework
<!--
  Copyright (C) 2010-2020 R-T Specialty, LLC.

  This file is part of liza.

  Copying and distribution of this file, with or without modification, are
  permitted in any medium without royalty provided the copyright notice and
  this notice are preserved.  This file is offered as-is, without warranty
  of any kind.
-->


Liza is a data collection, validation, and processing framework for JavaScript.


## About
The Liza Data Collection Framework&mdash;"Liza" for short&mdash;is an effort
to clean up, formalize, and expand upon a framework that was developed at
RT Specialty / LoVullo for collecting, validating, and processing large amounts
of user input for insurance quoting.


## Configuring
If your distribution does not contain a `configure' file in the project
root, then you likely have the sources as committed to the project
repository; you may generate the script by issuing the following command:

```
  $ ./autogen.sh
```

You may then see `./configure --help` for more information.


## Building
If `configure` is not available, see the section "Configuring" above.


```
  $ ./configure   # see --help for optional arguments
  $ npm install   # install js dependencies
  $ make          # build
  $ make check    # run code checks
```

## Additional Make Targets

```
  $ make format   # run auto-format with prettier
  $ make fix      # attempt to auto-fix linting errors
```


## Documentation
Compiled documentation for the latest release is available via our GitLab
mirror, which uses the same build pipeline as we do on our internal GitLab
instance.  Available formats are:

- [Multi-page HTML][doc-html]
- [PDF][doc-pdf]
- [Info][doc-info]


## Hacking
For more information on hacking Liza and publishing to npm, see
[`HACKING`](./HACKING).


## License
Liza is free software: you can redistribute it and/or modify it under the
terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

The liza server is licensed differently: you can redistribute it and/or
modify it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the License,
or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
more details.

The full licenses are available in `COPYING` and `COPYING.AGPL`.

[doc-html]: https://lovullo.gitlab.io/liza/
[doc-pdf]: https://lovullo.gitlab.io/liza/liza.pdf
[doc-info]: https://lovullo.gitlab.io/liza/liza.info

