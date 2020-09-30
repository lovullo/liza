/**
 *  Tests for HTTP Client wrapper
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
import chai = require('chai');
import {HttpClient as Sut} from '../../../src/system/network/HttpClient';
import {expect} from 'chai';

chai.use(require('chai-as-promised'));

describe('HttpClient', () => {
  describe('isValidUrl', () => {
    it('detects a valid URL', () => {
      expect(new Sut().isValidUrl('https://example.com')).to.be.true;
    });
    it('detects an invalid URL', () => {
      expect(new Sut().isValidUrl('')).to.be.false;
    });
  });

  describe('validateUrl', () => {
    it('detects an invalid URL', () => {
      expect(() => new Sut().validateUrl('')).to.throw(
        Error,
        'The provided URL is invalid: '
      );
    });
  });
});
