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

import {EventMediator as Sut} from '../../src/system/EventMediator';
import {context} from '../../src/error/ContextError';
import {EventEmitter} from 'events';
import {expect} from 'chai';
import {PsrLogger} from '../../src/system/PsrLogger';

describe('system.EventMediator captures and logs events', () => {
  it('document-processed triggers log#notice', () => {
    let method_called = false;

    const event_id = 'document-processed';
    const emitter = new EventEmitter();
    const log = createMockLogger();

    log.notice = (_str: string) => {
      method_called = true;
    };

    new Sut(log, emitter);

    emitter.emit(event_id);

    expect(method_called).to.be.true;
  });

  it('delta-publish triggers log#notice', () => {
    let method_called = false;

    const event_id = 'delta-publish';
    const emitter = new EventEmitter();
    const log = createMockLogger();

    log.notice = (_str: string) => {
      method_called = true;
    };

    new Sut(log, emitter);

    emitter.emit(event_id);

    expect(method_called).to.be.true;
  });

  it('amqp-conn-warn triggers log#warning', () => {
    let method_called = false;

    const event_id = 'amqp-conn-warn';
    const emitter = new EventEmitter();
    const log = createMockLogger();

    log.warning = (_str: string) => {
      method_called = true;
    };

    new Sut(log, emitter);

    emitter.emit(event_id);

    expect(method_called).to.be.true;
  });

  it('amqp-reconnect triggers log#warning', () => {
    let method_called = false;

    const event_id = 'amqp-reconnect';
    const emitter = new EventEmitter();
    const log = createMockLogger();

    log.warning = (_str: string) => {
      method_called = true;
    };

    new Sut(log, emitter);

    emitter.emit(event_id);

    expect(method_called).to.be.true;
  });

  it('context and stack are retrieved from error', () => {
    let method_called = false;

    const event_id = 'error';
    const err_msg = 'Foo';
    const stub_err = new Error(err_msg);
    const emitter = new EventEmitter();
    const log = createMockLogger();
    const err_context = {bar: 'baz'};

    const expected_context = {
      bar: err_context.bar,
      stack: stub_err.stack,
    };

    log.error = (str: string, context: any) => {
      expect(str).to.equal(err_msg);
      expect(context).to.deep.equal(expected_context);

      method_called = true;
    };

    new Sut(log, emitter);

    emitter.emit(event_id, context(stub_err, err_context));

    expect(method_called).to.be.true;
  });
});

function createMockLogger(): PsrLogger {
  return <PsrLogger>{
    debug(_msg: string | object, _context: object) {},
    info(_msg: string | object, _context: object) {},
    notice(_msg: string | object, _context: object) {
      console.log('asdasd msg: ', _msg);
    },
    warning(_msg: string | object, _context: object) {},
    error(_msg: string | object, _context: object) {},
    critical(_msg: string | object, _context: object) {},
    alert(_msg: string | object, _context: object) {},
    emergency(_msg: string | object, _context: object) {},
    log(_level: any, _msg: string | object, _context: object) {},
  };
}
