/**
 * Test case for GroupStateManager
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

const expect = require('chai').expect,
  sinon = require('sinon');

import {
  GroupStateManager as Sut,
  GroupState,
} from '../../../src/ui/group/GroupStateManager';

before(function () {
  this.jsdom = require('jsdom-global')();
});

after(function () {
  this.jsdom();
});

describe('ui.group.GroupStateManager', () => {
  describe('processDataAttributes', () => {
    it('processes the data attributes', () => {
      const sut = new Sut();
      let data_was_read = false;

      const elem = createHtmlElement();

      elem.getAttribute = () => {
        data_was_read = true;
        return 'foo_retry';
      };

      sut.processDataAttributes(elem);

      expect(data_was_read).to.be.true;
    });
  });

  describe('observes', () => {
    it('detects when the state manager observes a valid state', () => {
      const sut = new Sut();
      const elem = createHtmlElement();

      sut.processDataAttributes(elem);

      expect(sut.observes(<GroupState>'pending')).to.be.true;
    });

    it('detects when the state manager does not observe an invalid state', () => {
      const sut = new Sut();
      const elem = createHtmlElement();

      elem.getAttribute = () => '';

      sut.processDataAttributes(elem);

      expect(sut.observes(<GroupState>'foo')).to.be.false;
    });
  });

  describe('isPending', () => {
    it('detects a non-pending state', () => {
      const sut = new Sut();
      const elem = createHtmlElement();

      sut.processDataAttributes(elem);

      const bucket = createBucket();

      bucket.getDataByName = () => [0];

      expect(sut.is(<GroupState>'pending', bucket)).to.be.false;
    });

    it('detects a pending state', () => {
      const sut = new Sut();
      const elem = createHtmlElement();

      sut.processDataAttributes(elem);

      const bucket = createBucket();

      bucket.getDataByName = () => [1];

      expect(sut.is(<GroupState>'pending', bucket)).to.be.true;
    });

    it('detects a multi-variate pending state', () => {
      const sut = new Sut();
      const elem = createHtmlElement();

      elem.getAttribute = () => 'foo_retry bar_retry';

      sut.processDataAttributes(elem);

      const bucket = createBucket();
      const bucket_values = {
        foo_retry: [0],
        bar_retry: [1],
      };

      bucket.getDataByName = (key: 'foo_retry' | 'bar_retry') => {
        return bucket_values[key];
      };

      expect(sut.is(<GroupState>'pending', bucket)).to.be.true;
    });
  });

  describe('isDisabled', () => {
    it('detects a non-disabled state', () => {
      const sut = new Sut();
      const elem = createHtmlElement();

      sut.processDataAttributes(elem);

      const bucket = createBucket();

      bucket.getDataByName = () => [0];

      expect(sut.is(<GroupState>'disabled', bucket)).to.be.false;
    });

    it('detects a disabled state', () => {
      const sut = new Sut();
      const elem = createHtmlElement();

      sut.processDataAttributes(elem);

      const bucket = createBucket();

      bucket.getDataByName = () => [1];

      expect(sut.is(<GroupState>'disabled', bucket)).to.be.true;
    });
  });
});

const createBucket = () => {
  return {
    getDataByName: sinon.stub(),
  };
};

const createHtmlElement = () => {
  let elem = document.createElement('div');
  elem.getAttribute = () => 'foo_retry';

  return elem;
};
