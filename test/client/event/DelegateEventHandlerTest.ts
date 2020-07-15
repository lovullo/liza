/**
 * Tests DelayEventHandler
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

'use strict';

import {expect} from 'chai';
import {DelegateEventHandler as Sut} from '../../../src/client/event/DelegateEventHandler';
import {
  EventHandler,
  EventHandlers,
} from '../../../src/client/event/EventHandler';
import {UnknownEventError} from '../../../src/client/event/UnknownEventError';

describe('DelegateEventHandler', () => {
  it('Calls a handler', done => {
    let handle_called = false;

    const handlers = <EventHandlers>{
      rate: <EventHandler>{
        handle: (_: any, __: any, ___: any) => {
          handle_called = true;
        },
      },
    };

    const sut = new Sut(handlers);

    sut.handle('rate', () => {}, {});

    expect(handle_called).to.equal(true);
    done();
  });

  it('Throws exception if no handler is found for an event type', done => {
    let handle_called = false;

    const handlers = <EventHandlers>{
      rate: <EventHandler>{
        handle: (_: any, __: any, ___: any) => {
          handle_called = true;
        },
      },
    };

    const sut = new Sut(handlers);

    expect(() => {
      sut.handle('delay', () => {}, {});
    }).to.throw(UnknownEventError);

    expect(handle_called).to.equal(false);
    done();
  });

  it('Returns true if it has a handler for an event type', done => {
    const handlers = <EventHandlers>{
      rate: <EventHandler>{
        handle: (_: any, __: any, ___: any) => {},
      },
    };

    const sut = new Sut(handlers);

    expect(sut.hasHandler('rate')).to.equal(true);
    done();
  });

  it("Returns false if it doesn't have a handler for an event type", done => {
    const handlers = <EventHandlers>{
      rate: <EventHandler>{
        handle: (_: any, __: any, ___: any) => {},
      },
    };

    const sut = new Sut(handlers);

    expect(sut.hasHandler('delay')).to.equal(false);
    done();
  });
});
