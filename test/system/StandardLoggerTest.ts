/**
 * Event logger test
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {StandardLogger as Sut} from '../../src/system/StandardLogger';
import {LogLevel} from '../../src/system/PsrLogger';
import {expect} from 'chai';

const sinon = require('sinon');

declare interface MockConsole extends Console {
  getLevel(): string;
  getStr(): string;
}

describe('system.StandardLogger captures and logs events', () => {
  it('debug triggers console output level: info', () => {
    const con = createMockConsole();
    const env = 'test';
    const sut = new Sut(con, ts_ctor, env);

    sut.debug('Foo');

    expect(con.getLevel()).to.equal('info');
  });

  it('info triggers console output level: info', () => {
    const con = createMockConsole();
    const env = 'test';
    const sut = new Sut(con, ts_ctor, env);

    sut.info('Foo');

    expect(con.getLevel()).to.equal('info');
  });

  it('notice triggers console output level: log', () => {
    const con = createMockConsole();
    const env = 'test';
    const sut = new Sut(con, ts_ctor, env);

    sut.notice('Foo');

    expect(con.getLevel()).to.equal('log');
  });

  it('warning triggers console output level: warn', () => {
    const con = createMockConsole();
    const env = 'test';
    const sut = new Sut(con, ts_ctor, env);

    sut.warning('Foo');

    expect(con.getLevel()).to.equal('warn');
  });

  it('error triggers console output level: error', () => {
    const con = createMockConsole();
    const env = 'test';
    const sut = new Sut(con, ts_ctor, env);

    sut.error('Foo');

    expect(con.getLevel()).to.equal('error');
  });

  it('critical triggers console output level: error', () => {
    const con = createMockConsole();
    const env = 'test';
    const sut = new Sut(con, ts_ctor, env);

    sut.critical('Foo');

    expect(con.getLevel()).to.equal('error');
  });

  it('alert triggers console output level: error', () => {
    const con = createMockConsole();
    const env = 'test';
    const sut = new Sut(con, ts_ctor, env);

    sut.alert('Foo');

    expect(con.getLevel()).to.equal('error');
  });

  it('emergency triggers console output level: error', () => {
    const con = createMockConsole();
    const env = 'test';
    const sut = new Sut(con, ts_ctor, env);

    sut.emergency('Foo');

    expect(con.getLevel()).to.equal('error');
  });

  it('log triggers corresponding log level', () => {
    const con = createMockConsole();
    const env = 'test';
    const sut = new Sut(con, ts_ctor, env);

    sut.log(LogLevel.ERROR, 'Foo');

    expect(con.getLevel()).to.equal('error');
  });

  it('Context is included in structured output', () => {
    const con = createMockConsole();
    const env = 'test';
    const sut = new Sut(con, ts_ctor, env);
    const context = {bar: 'baz'};
    const expected_output = {
      message: 'Foo',
      timestamp: '1970-01-02T10:12:03.000Z',
      service: 'quote-server',
      env: 'test',
      severity: 'NOTICE',
      context: {
        bar: 'baz',
      },
    };

    sut.notice('Foo', context);

    expect(con.getStr()).to.deep.equal(JSON.stringify(expected_output));
  });
});

function ts_ctor(): UnixTimestamp {
  return <UnixTimestamp>123123;
}

function createMockConsole(): MockConsole {
  const mock = sinon.mock(console);

  mock.lvl = '';
  mock.str = '';
  mock.info = (str: string) => {
    mock.str = str;
    mock.lvl = 'info';
  };
  mock.log = (str: string) => {
    mock.str = str;
    mock.lvl = 'log';
  };
  mock.warn = (str: string) => {
    mock.str = str;
    mock.lvl = 'warn';
  };
  mock.error = (str: string) => {
    mock.str = str;
    mock.lvl = 'error';
  };
  mock.getLevel = () => mock.lvl;
  mock.getStr = () => mock.str;

  return mock;
}
