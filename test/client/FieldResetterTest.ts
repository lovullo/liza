/**
 * Test case for FieldResetter
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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

import {ClientQuote} from '../../src/client/quote/ClientQuote';
import {FieldResetter as Sut} from '../../src/client/FieldResetter';
import {StepUi} from '../../src/ui/step/StepUi';
import {expect} from 'chai';
import {
  createStubClient,
  createStubUi,
  createStubClientQuote,
  createStubProgram,
} from './CommonResources';

const sinon = require('sinon');

describe('FieldResetter', () => {
  it('reset fields to empty string by default', () => {
    const {client, program} = getClient();
    const sut = new Sut(client);

    program.hasNaField = () => true;

    const data = {some_field: ['0']};
    const expected = {some_field: ['']};

    expect(sut.reset(data)).to.deep.equal(expected);
  });

  it('reset fields to their own default value', () => {
    const element_styler = {
      getDefault(_field: string): string {
        return 'default';
      },
    };

    const {client} = getClient();

    sinon.stub(client, 'elementStyler').get(() => {
      return element_styler;
    });

    const sut = new Sut(client);

    const data = {some_field: ['0']};
    const expected = {some_field: ['default']};

    expect(sut.reset(data)).to.deep.equal(expected);
  });
});

const getClient = (step: StepUi | null = null) => {
  const quote = createStubClientQuote();
  const ui = createStubUi(step);
  const program = createStubProgram({defaults: {some_field: 'default'}});

  return {
    client: createStubClient(<ClientQuote>(<unknown>quote), ui, program),
    program,
  };
};
