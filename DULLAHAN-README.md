# Dullahan Daemon
<!--
  Copyright (C) 2010-2020 R-T Specialty, LLC.

  This file is part of liza.

  Copying and distribution of this file, with or without modification, are
  permitted in any medium without royalty provided the copyright notice and
  this notice are preserved.  This file is offered as-is, without warranty
  of any kind.
-->


## About
The Dullahan Daemon is a background process that exposes "headless" rating
endpoints and invokes rating outside of the traditional quote server.


## Building & Running Unit Tests
See main Liza documentation [`README.md`](./README.md).


## Starting the Daemon
Run from the project root:
```bash
$ ./bin/dullahan
```

## Configuring the .env

Configuration for `.env` is an extension of Liza's main `.env` file. Dullahan currently requires values set for `NODE_PORT` and `NODE_ENV` which are `6047` and `local` respectively for local development. It is advisable to add the values to a separate `.env.local` file.

## Testing responses via cURL

`/indication` Example:

```bash
$ curl -X POST --header "Content-Type: application/json" http://localhost:6047/indication?callback=http://example.com
```
## Observability

### Logs
All logs are structured in JSON and use the standard service and env fields. From splunk you can search for `service=dullahan` to see all this service's logs (and filter further with `env=` or any other log elements).

### Graphs
- http://dc02prom01.rsgcorp.local:3000/d/rk_1DZKGk/dullahan?orgId=1

## Runbook
- https://rsgcorp.atlassian.net/wiki/spaces/DEV/pages/1739784348/Runbook+Dullahan