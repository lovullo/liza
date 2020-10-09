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
import {Nav} from '../../../src/client/nav/Nav';
import {QuoteTransport} from '../../../src/client/transport/QuoteTransport';

import {expect} from 'chai';
import {Ui} from '../../../src/ui/Ui';
import {PositiveInteger} from '../../../src/numeric';

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
      label: 'does not autosave when step save is in progress',
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

  it('Callback sets the top visited step', () => {
    const {
      client: client,
      quote: quote,
      nav: nav,
      program: program,
      transport: transport,
    } = createStubs({foo: [1]});

    program.autosave = true;

    const top_step_id = <PositiveInteger>4;
    quote.getTopVisitedStepId = () => top_step_id;

    let given_top_step_id = <PositiveInteger>0;
    nav.setTopVisitedStepId = (step_id: PositiveInteger) => {
      given_top_step_id = step_id;
    };

    let autosave_called = false;
    quote.autosave = (_: any, cb: any) => {
      autosave_called = true;
      cb();
      return quote;
    };

    sut(client, program, transport)(quote);
    expect(given_top_step_id).to.be.equals(top_step_id);
    expect(autosave_called).to.be.true;
  });
});

function createStubClientQuote(diff: any = {}) {
  return <ClientQuote>(<unknown>{
    on: (_: any, cb: any) => cb(diff),
    autosave: (_: any) => {},
    isLocked: () => false,
    getTopVisitedStepId: () => 0,
    invalidateAutosave: () => false,
  });
}

function createStubClient(ui: Ui, navigation_pending: boolean, nav: Nav) {
  return <Client>(<unknown>{
    nav: nav,
    isNavigating: () => navigation_pending,
    getUi: () => ui,
  });
}

function createStubUi(save_pending: boolean) {
  return <Ui>(<unknown>{
    isSaving: () => save_pending,
  });
}

function createStubNav() {
  return <Nav>(<unknown>{
    setTopVisitedStepId: (_: any) => {},
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
  const ui = createStubUi(save_pending);
  const nav = createStubNav();
  const client = createStubClient(ui, navigation_pending, nav);
  const quote = createStubClientQuote(diff);
  const program = createStubProgram();
  const transport = createStubTransport();

  return {
    client: client,
    ui: ui,
    nav: nav,
    quote: quote,
    program: program,
    transport: transport,
  };
}
