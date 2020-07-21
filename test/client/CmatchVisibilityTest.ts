/**
 * Test case for CmatchVisibility
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
import {CmatchVisibility as Sut} from '../../src/client/CmatchVisibility';
import {StepUi} from '../../src/ui/step/StepUi';
import {expect} from 'chai';
import {
  createStubClient,
  createStubClientQuote,
  createStubUi,
} from './CommonResources';

const sinon = require('sinon');

describe('CmatchVisibility', () => {
  describe('_getBlueprints', () => {
    [
      {
        description: 'handles undefined classifications',
        classifications: {},
        input: [
          {
            name: 'shown_field',
            cname: '--vis-shown-field',
          },
          {
            name: 'hidden_field',
            cname: '--vis-hidden-field',
          },
        ],
        expected: [
          {
            name: 'shown_field',
            cname: '--vis-shown-field',
            show: [],
            hide: [],
          },
          {
            name: 'hidden_field',
            cname: '--vis-hidden-field',
            show: [],
            hide: [],
          },
        ],
      },
      {
        description: 'handles scalar classifications',
        classifications: {
          '--vis-shown-field': {indexes: 1},
          '--vis-hidden-field': {indexes: 0},
        },
        input: [
          {
            name: 'shown_field',
            cname: '--vis-shown-field',
          },
          {
            name: 'hidden_field',
            cname: '--vis-hidden-field',
          },
        ],
        expected: [
          {
            name: 'shown_field',
            cname: '--vis-shown-field',
            show: [0],
            hide: [],
          },
          {
            name: 'hidden_field',
            cname: '--vis-hidden-field',
            show: [],
            hide: [0],
          },
        ],
      },
      {
        description: 'handles vector classifications',
        classifications: {
          '--vis-shown-field': {indexes: [1]},
          '--vis-hidden-field': {indexes: [0]},
        },
        input: [
          {
            name: 'shown_field',
            cname: '--vis-shown-field',
          },
          {
            name: 'hidden_field',
            cname: '--vis-hidden-field',
          },
        ],
        expected: [
          {
            name: 'shown_field',
            cname: '--vis-shown-field',
            show: [0],
            hide: [],
          },
          {
            name: 'hidden_field',
            cname: '--vis-hidden-field',
            show: [],
            hide: [0],
          },
        ],
      },
      {
        description: 'handles indexes for multi-length vectors',
        classifications: {
          '--vis-shown-field': {indexes: [1, 1]},
          '--vis-partially-shown-field': {indexes: [1, 0]},
          '--vis-hidden-field': {indexes: [0, 0]},
        },
        input: [
          {
            name: 'shown_field',
            cname: '--vis-shown-field',
          },
          {
            name: 'partially_shown_field',
            cname: '--vis-partially-shown-field',
          },
          {
            name: 'hidden_field',
            cname: '--vis-hidden-field',
          },
        ],
        expected: [
          {
            name: 'shown_field',
            cname: '--vis-shown-field',
            show: [0, 1],
            hide: [],
          },
          {
            name: 'partially_shown_field',
            cname: '--vis-partially-shown-field',
            show: [0],
            hide: [1],
          },
          {
            name: 'hidden_field',
            cname: '--vis-hidden-field',
            show: [],
            hide: [0, 1],
          },
        ],
      },
      {
        description: 'handles indexes for matrices',
        classifications: {
          '--vis-shown-field': {
            indexes: [
              [1, 1],
              [1, 1],
            ],
          },
          '--vis-partially-shown-field': {
            indexes: [
              [1, 0],
              [0, 1],
            ],
          },
          '--vis-hidden-field': {
            indexes: [
              [0, 0],
              [0, 0],
            ],
          },
        },
        input: [
          {
            name: 'shown_field',
            cname: '--vis-shown-field',
          },
          {
            name: 'partially_shown_field',
            cname: '--vis-partially-shown-field',
          },
          {
            name: 'hidden_field',
            cname: '--vis-hidden-field',
          },
        ],
        expected: [
          {
            name: 'shown_field',
            cname: '--vis-shown-field',
            show: [0, 1],
            hide: [],
          },
          {
            name: 'partially_shown_field',
            cname: '--vis-partially-shown-field',
            show: [0, 1],
            hide: [],
          },
          {
            name: 'hidden_field',
            cname: '--vis-hidden-field',
            show: [],
            hide: [0, 1],
          },
        ],
      },
    ].forEach(input => {
      it(input.description, () => {
        const stubs = {
          getLastClassify: () => {
            return input.classifications;
          },
        };

        const sut = new Sut(getClient(null, stubs));
        const actual = sut.getBlueprints(input.input);
        expect(actual).to.deep.equal(input.expected);
      });
    });
  });
});

function getClient(
  step: StepUi | null = null,
  stubs: {[method_name: string]: Function}
) {
  const quote = createStubClientQuote();
  const ui = createStubUi(step);

  if (stubs.getLastClassify) {
    sinon.stub(quote, 'getLastClassify').callsFake(stubs.getLastClassify);
  }

  return createStubClient(<ClientQuote>(<unknown>quote), ui);
}
