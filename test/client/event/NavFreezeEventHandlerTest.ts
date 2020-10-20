/**
 * Tests NavFreezeEventHandler
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
import {Ui} from '../../../src/ui/Ui';
import {Client} from '../../../src/client/Client';
import {ClientAction} from '../../../src/client/action/ClientAction';
import {NavFreezeEventHandler as Sut} from '../../../src/client/event/NavFreezeEventHandler';

describe('NavFreezeEventHandler', () => {
  it('Calls callback', () => {
    const client = getMockClient();
    const sut = new Sut(client);
    const data: ClientAction = {
      action: 'navFreeze',
    };

    let callback_called = false;

    const cb = () => {
      callback_called = true;
    };

    sut.handle('navFreeze', cb, data);

    expect(callback_called).to.equal(true);
  });

  [
    {
      label: 'Use default lock message if none is supplied',
      value: '',
      expected: '<div class="text">Navigation is locked</div>',
    },
    {
      label: 'Use lock message if one is supplied',
      value: 'Foobar',
      expected: '<div class="text">Foobar</div>',
    },
  ].forEach(({label, value, expected}) => {
    it(label, done => {
      const ui = getMockUi();
      const client = getMockClient(ui);
      const sut = new Sut(client);
      const data: ClientAction = {
        action: 'navFreeze',
        value: value,
      };

      ui.showNotifyBar = (given: any) => {
        expect(given.innerHTML).to.equal(expected);

        done();
        return ui;
      };

      sut.handle('navFreeze', () => {}, data);
    });
  });
});

function getMockUi(): Ui {
  const ui = <Ui>(<unknown>{
    showNotifyBar: () => ui,
    freezeNav: () => ui,
  });

  return ui;
}

function getMockDocument(): HTMLDocument {
  const element = getMockElement();

  return <HTMLDocument>(<unknown>{
    createElement: () => element,
  });
}

function getMockElement(): HTMLElement {
  return <HTMLElement>(<unknown>{
    innerHTML: '',
  });
}

function getMockClient(ui?: Ui): Client {
  const document = getMockDocument();

  return <Client>(<unknown>{
    getUi: () => ui || getMockUi(),
    getDocument: () => document,
  });
}
