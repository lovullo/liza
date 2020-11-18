/**
 *  Tests for Indication Controller
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import {Program} from '../../../src/program/Program';
import {expect} from 'chai';
import {ProgramFactory as Sut} from '../../../src/dullahan/program/ProgramFactory';
import {QuoteDataBucket} from '../../../src/bucket/QuoteDataBucket';
import {StagingBucket} from '../../../src/bucket/StagingBucket';

let data: CommonObject | null = null;

before(function () {
  data = null;
});

describe('ProgramFactory', () => {
  describe('createProgram', () => {
    it('returns a bucket and a program from a passed in bucket', () => {
      const sut = new Sut(createProgram, createBucket);
      const data = {foo: 'bar'};
      const {bucket} = sut.createProgram(data);
      expect(bucket.getData()).to.deep.equal(data);
    });

    it('returns a bucket and a program with no bucket passed in', () => {
      const sut = new Sut(createProgram, createBucket);
      const {bucket} = sut.createProgram();
      expect(bucket.getData()).to.deep.equal({});
    });
  });
});

const createProgram = () => {
  return <Program>{
    initQuote(_bucket: StagingBucket, _store_only: boolean): void {},
    meta: {groups: {}},
    groupExclusiveFields: {},
  };
};

const createBucket = () => {
  return <QuoteDataBucket>{
    setValues(_data: Record<string, any>) {
      data = _data;
      return this;
    },

    getData(): Record<string, any> | null {
      return data;
    },
  };
};
