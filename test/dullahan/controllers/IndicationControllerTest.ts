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
import sinon = require('sinon');
import {EventEmitter} from 'events';
import {HttpClient} from '../../../src/system/network/HttpClient';
import {
  DataRetriever,
  ProgramFactory,
} from '../../../src/dullahan/program/ProgramFactory';
import {Program} from '../../../src/program/Program';
import {Response} from 'node-fetch';
import {expect} from 'chai';
import {indication as Sut} from '../../../src/dullahan/controllers/IndicationController';
import {mockReq, mockRes} from 'sinon-express-mock';
import {
  CustomRater,
  RaterFactory,
} from '../../../src/dullahan/program/RaterFactory';

describe('IndicationController', () => {
  describe('create', () => {
    it('fails when an invalid webhook is provided', () => {
      const sut = createSutCreate();
      const req = mockReq({});
      const res = mockRes({});

      expect(() => sut(req, res)).to.throw(
        Error,
        'The provided URL is invalid:'
      );

      expect(res.status.withArgs(422).callCount).to.equal(1);
    });

    it('calls webhook when a valid request is processed', () => {
      const http_client = createHttpClient();
      const given = 'https://some.websitethatdoesnotexist.joe';

      sinon.stub(http_client, 'post').callsFake((url, _payload, _options) => {
        expect(url).to.be.equal(given);
        return Promise.resolve(<Response>{});
      });

      const sut = createSutCreate({http_client});
      const req = mockReq({});
      const res = mockRes({});

      req.query.callback = given;

      sut(req, res);

      expect(res.status.withArgs(202).callCount).to.equal(1);
    });

    it('decodes and calls webhook when a valid request is processsed', () => {
      const http_client = createHttpClient();
      const given = 'https%3A%2F%2Fsome.websitethatdoesnotexist.joe';

      sinon.stub(http_client, 'post').callsFake((url, _payload, _options) => {
        expect(url).to.be.equal('https://some.websitethatdoesnotexist.joe');
        return Promise.resolve(<Response>{});
      });

      const sut = createSutCreate({http_client});
      const req = mockReq({});
      const res = mockRes({});

      req.query.callback = given;

      sut(req, res);

      expect(res.status.withArgs(202).callCount).to.equal(1);
    });
  });
});

const createEventEmitter = () => {
  return new (class extends EventEmitter {})();
};

const createHttpClient = () => {
  return new (class extends HttpClient {})();
};

const createProgramFactory = () => {
  return <ProgramFactory>{
    createProgram() {
      return {bucket: <DataRetriever>{}, program: <Program>{}};
    },
  };
};

const createRaterFactory = () => {
  return <RaterFactory>{
    createRaters() {
      return [
        <CustomRater>{
          rate() {},
        },
      ];
    },
  };
};

const createSutCreate = (dependencies: CommonObject = {}) => {
  const {emitter, http_client, program_factory, rater_factory} = dependencies;

  return Sut.create(<EventEmitter>emitter ?? createEventEmitter())(
    <HttpClient>http_client ?? createHttpClient()
  )(<ProgramFactory>program_factory ?? createProgramFactory())(
    <RaterFactory>rater_factory ?? createRaterFactory()
  );
};
