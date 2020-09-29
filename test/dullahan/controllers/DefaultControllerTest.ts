/**
 *  Tests for Default Controller
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
import {DefaultController as Sut} from '../../../src/dullahan/controllers/DefaultController';
import {expect} from 'chai';
import {mockReq, mockRes} from 'sinon-express-mock';

describe('DefaultController', () => {
  describe('handleHealthcheck', () => {
    it('response with 204 code when healthy', () => {
      const sut = new Sut();
      const req = mockReq({});
      const res = mockRes({});

      sut.handleHealthcheck(req, res);

      expect(res.status.withArgs(204).callCount).to.equal(1);
    });
  });
});
