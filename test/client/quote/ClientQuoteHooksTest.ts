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
    const {quote: quote, program: program, transport: transport} = createStubs({
      foo: [1],
    });

    let quote_hooked = false;

    program.autosave = false;

    quote.on = (_: any) => {
      quote_hooked = true;

      return quote;
    };

    sut(program, transport)(quote);

    expect(quote_hooked).to.be.false;
  });

  it('Do not hook quote when quote is locked', () => {
    const {quote: quote, program: program, transport: transport} = createStubs({
      foo: [1],
    });

    let quote_hooked = false;

    quote.isLocked = () => true;

    quote.on = (_: any) => {
      quote_hooked = true;

      return quote;
    };

    sut(program, transport)(quote);

    expect(quote_hooked).to.be.false;
  });

  [
    {
      label: 'hook calls autosave',
      diff: {bar: [1]},
      expected_autosave_called: true,
    },
    {
      label: 'does not autosave an empty diff',
      diff: {},
      expected_autosave_called: false,
    },
    {
      label: 'does not autosave a diff with only empty arrays',
      diff: {foo: []},
      expected_autosave_called: false,
    },
  ].forEach(({label, diff, expected_autosave_called}) => {
    it(label, () => {
      const {
        quote: quote,
        program: program,
        transport: transport,
      } = createStubs(diff);

      let autosave_called = false;

      quote.autosave = (_: any) => {
        autosave_called = true;

        return quote;
      };

      sut(program, transport)(quote);

      expect(autosave_called).to.equal(expected_autosave_called);
    });
  });
});

function createStubClientQuote(diff: any = {}) {
  return <ClientQuote>(<unknown>{
    on: (_: any, cb: any) => cb(diff),
    autosave: (_: any) => {},
    isLocked: () => false,
  });
}

function createStubClient() {
  return <Client>(<unknown>{});
}

function createStubProgram() {
  return <Program>(<unknown>{
    autosave: true,
  });
}

function createStubTransport() {
  return <QuoteTransport>(<unknown>{});
}

function createStubs(diff: any = {}) {
  const client = createStubClient();
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
