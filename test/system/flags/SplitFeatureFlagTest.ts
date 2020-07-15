/**
 * Test case for SplitioFeatureFlag
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

import {expect} from 'chai';
import {
  SplitFeatureFlag as Sut,
  SplitClient,
} from '../../../src/system/flags/SplitFeatureFlag';
import {
  FeatureFlag,
  FeatureFlagConditions,
} from '../../../src/system/flags/FeatureFlag';

describe('SplitioFeatureFlag', () => {
  it("isEnabled retrieves 'on' value and returns true", () => {
    const client = createClient('on');
    const default_flag = createDefault();
    const sut = new Sut(default_flag, {}, client);

    return expect(sut.isEnabled('liza_autosave')).to.eventually.be.true;
  });

  it("isEnabled retrieves 'off' value and returns false", () => {
    const client = createClient('off');
    const default_flag = createDefault();
    const sut = new Sut(default_flag, {}, client);

    return expect(sut.isEnabled('liza_autosave')).to.eventually.be.false;
  });

  it('isEnabled uses defaults when the response is not on or off', () => {
    let default_called = false;

    const client = createClient('foo');
    const default_flag = createDefault();

    default_flag.isEnabled = (_: string) => {
      default_called = true;

      return Promise.resolve(false);
    };

    const sut = new Sut(default_flag, {}, client);

    return expect(sut.isEnabled('liza_autosave')).to.eventually.be.false.then(
      () => expect(default_called).to.be.true
    );
  });

  describe('base conditions are joined with isEnabled conditions', () => {
    (<
      {
        label: string;
        base: FeatureFlagConditions;
        supplied: FeatureFlagConditions;
        expected: FeatureFlagConditions;
      }[]
    >[
      {
        label: 'Newly supplied variables are added to base',
        base: {foo: 'bar1'},
        supplied: {bar: 'baz'},
        expected: {foo: 'bar1', bar: 'baz'},
      },
      {
        label: 'Newly supplied variables override base',
        base: {foo: 'bar1'},
        supplied: {foo: 'baz'},
        expected: {foo: 'baz'},
      },
    ]).forEach(({label, base, supplied, expected}) => {
      it(label, function () {
        const given_key = 'liza_autosave';

        let treatment_called = false;

        const client = createClient('on');
        const default_flag = createDefault();

        client.getTreatment = (_: any, key: any, atts?: any) => {
          expect(key).to.equal(given_key);
          expect(atts).to.deep.equal(expected);

          treatment_called = true;

          return Promise.resolve('foo');
        };

        const sut = new Sut(default_flag, base, client);

        return expect(sut.isEnabled(given_key, supplied))
          .to.eventually.equal(false)
          .then(() => expect(treatment_called).to.be.true);
      });
    });
  });
});

function createDefault(defaults: FeatureFlagConditions = {}): FeatureFlag {
  return <FeatureFlag>{
    close: () => {},
    isEnabled: (key: string) => {
      return Promise.resolve(defaults[key] || false);
    },
  };
}

function createClient(treatment_value: string = ''): SplitClient {
  return <SplitClient>{
    destroy: () => {},
    getTreatment: (_: any, __: any, ___: any) => {
      return Promise.resolve(treatment_value);
    },
  };
}
