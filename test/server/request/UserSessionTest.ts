/**
 * Tests UserSession
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
import {expect} from 'chai';
import {UserSession as Sut} from '../../../src/server/request/UserSession';

describe('UserSession', () => {
  it('session data is unserialized', () => {
    const session_id = '1234234';
    const session_data =
      'agentID|s:6:"900000";retail_agency_num|s:8:"AGT12345";user_name|s:11:"foo@bar.com";agentNAME|s:3:"Foo";';

    const expected_username = 'foo@bar.com';
    const expected_agent_name = 'Foo';
    const expected_agent_id = 900000;
    const expected_agency_num = 'AGT12345';
    const expected_data = {
      agentID: '900000',
      agentNAME: 'Foo',
      retail_agency_num: 'AGT12345',
      user_name: 'foo@bar.com',
    };

    const memcache = {
      get: (id: any, callback: (_err: any, data: any) => void) => {
        expect(id).to.be.equal(session_id);
        callback(undefined, session_data);
      },
    };

    const sut = new Sut(session_id, memcache);
    expect(sut.getData()).to.deep.equal(expected_data);
    expect(sut.userName()).to.equal(expected_username);
    expect(sut.agentName()).to.equal(expected_agent_name);
    expect(sut.agentId()).to.equal(expected_agent_id);
    expect(sut.agencyNumber()).to.equal(expected_agency_num);
  });

  describe('UserSession#isInternal', () => {
    [
      {
        label: 'Session is internal',
        agentId: 900000,
        expected: true,
      },
      {
        label: 'Session is not internal',
        agentId: 900001,
        expected: false,
      },
    ].forEach(({label, agentId, expected}) => {
      it(label, () => {
        const memcache = {
          get: (_: any, __: any) => {},
        };

        const sut = new Sut('', memcache);
        sut.setAgentId(agentId);
        expect(sut.agentId()).to.equal(agentId);
        expect(sut.isInternal()).to.equal(expected);
      });
    });
  });
});
