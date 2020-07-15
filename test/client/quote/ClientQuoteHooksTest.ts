/**
 * Test case for Client Quote Hooks
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {createQuoteStagingHook as sut} from '../../../src/client/quote/ClientQuoteHooks';
import {Client} from '../../../src/client/Client';
import {ClientQuote} from '../../../src/client/quote/ClientQuote';
import {Program} from '../../../src/program/Program';
import {QuoteTransport} from '../../../src/client/transport/QuoteTransport';

import {expect} from 'chai';

describe('createQuoteStagingHook', () => {
  it('Do not hook quote when autosave is missing', () => {
    const {
      client: client,
      quote: quote,
      program: program,
      transport: transport,
    } = createStubs({foo: [1]});

    let quote_hooked = false;

    program.autosave = false;

    quote.on = (_: any) => {
      quote_hooked = true;

      return quote;
    };

    sut(client, program, transport)(quote);

    expect(quote_hooked).to.be.false;
  });

  it('Do not hook quote when quote is locked', () => {
    const {
      client: client,
      quote: quote,
      program: program,
      transport: transport,
    } = createStubs({foo: [1]});

    let quote_hooked = false;

    quote.isLocked = () => true;

    quote.on = (_: any) => {
      quote_hooked = true;

      return quote;
    };

    sut(client, program, transport)(quote);

    expect(quote_hooked).to.be.false;
  });

  [
    {
      label: 'hook calls autosave',
      diff: {bar: [1]},
      save_pending: false,
      navigation_pending: false,
      expected_autosave_called: true,
    },
    {
      label: 'does not autosave an empty diff',
      diff: {},
      save_pending: false,
      navigation_pending: false,
      expected_autosave_called: false,
    },
    {
      label: 'does not autosave a diff with only empty arrays',
      diff: {foo: []},
      save_pending: false,
      navigation_pending: false,
      expected_autosave_called: false,
    },
    {
      label: 'does not autosave when client is saving a step',
      diff: {foo: [1]},
      save_pending: true,
      navigation_pending: false,
      expected_autosave_called: false,
    },
    {
      label: 'does not autosave when navigation is in progress',
      diff: {foo: [1]},
      save_pending: false,
      navigation_pending: true,
      expected_autosave_called: false,
    },
  ].forEach(
    ({
      label,
      diff,
      save_pending,
      navigation_pending,
      expected_autosave_called,
    }) => {
      it(label, () => {
        const {
          client: client,
          quote: quote,
          program: program,
          transport: transport,
        } = createStubs(diff, save_pending, navigation_pending);

        let autosave_called = false;

        quote.autosave = (_: any) => {
          autosave_called = true;

          return quote;
        };

        sut(client, program, transport)(quote);

        expect(autosave_called).to.equal(expected_autosave_called);
      });
    }
  );
});

function createStubClientQuote(diff: any = {}) {
  return <ClientQuote>(<unknown>{
    on: (_: any, cb: any) => cb(diff),
    autosave: (_: any) => {},
    isLocked: () => false,
  });
}

function createStubClient(save_pending: boolean, navigation_pending: boolean) {
  return <Client>(<unknown>{
    isSaving: () => save_pending,
    isNavigating: () => navigation_pending,
  });
}

function createStubProgram() {
  return <Program>(<unknown>{
    autosave: true,
  });
}

function createStubTransport() {
  return <QuoteTransport>(<unknown>{});
}

function createStubs(
  diff: any = {},
  save_pending: boolean = false,
  navigation_pending: boolean = false
) {
  const client = createStubClient(save_pending, navigation_pending);
  const quote = createStubClientQuote(diff);
  const program = createStubProgram();
  const transport = createStubTransport();

  return {
    client: client,
    quote: quote,
    program: program,
    transport: transport,
  };
}
