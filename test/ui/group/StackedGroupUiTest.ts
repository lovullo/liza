/**
 * Test case for StackedGroupUi
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

import {StackedGroupUi as Sut} from '../../../src/ui/group/StackedGroupUi';
import {
  createSut,
  createQuote,
  createGroup,
  createContent,
  createContainer,
  createContext,
} from './CommonResources';

describe('ui.group.StackedGroupUi', () => {
  describe('#showField', function () {
    [
      {
        field: 'foo_bar',
        index: 0,
      },
      {
        field: 'bar_foo',
        index: 1,
      },
    ].forEach(({field, index}) => {
      it(`it shows the header for ${field} when group fields are visible`, () => {
        const container = createContainer();
        const content = createContent();

        content.querySelector
          .withArgs('div.stacked-container')
          .returns(container);

        const sut = createSut(Sut, {
          field: field,
          content: content,
        });

        const removeClass = sinon.stub();

        const header = {
          classList: {
            remove: removeClass,
          },
        };

        sut.getCurrentIndex = sinon.stub().returns(10);
        sut.hasVisibleField = sinon.stub().withArgs(index).returns(true);

        container.querySelectorAll.withArgs('dl').returns([header, header]);

        const quote = createQuote();

        content.querySelectorAll.withArgs('dl').returns([header, header]);

        sut.init(quote);
        sut.showField(field, index);

        expect(removeClass.calledOnce).to.be.true;
      });
    });
  });

  describe('#hideField', function () {
    [
      {
        field: 'foo_baz',
        index: 0,
      },
      {
        field: 'baz_foo',
        index: 1,
      },
    ].forEach(({field, index}) => {
      it(`it hides the header for ${field} when no group fields are visible`, () => {
        const container = createContainer();
        const content = createContent();

        content.querySelector
          .withArgs('div.stacked-container')
          .returns(container);

        const sut = createSut(Sut, {
          field: field,
          content: content,
        });

        const addClass = sinon.stub();

        const header = {
          classList: {
            add: addClass,
          },
        };

        sut.getCurrentIndex = sinon.stub().returns(10);
        sut.hasVisibleField = sinon.stub().withArgs(index).returns(false);

        container.querySelectorAll.withArgs('dl').returns([header, header]);

        const quote = createQuote();

        content.querySelectorAll.withArgs('dl').returns([header, header]);

        sut.init(quote);
        sut.hideField(field, index);

        expect(addClass.calledOnce).to.be.true;
      });
    });
  });

  describe('removeIndex', () => {
    it('calls GroupContext and ElementStyler remove methods', () => {
      const container = createContainer();
      const content = createContent();

      const index = 1;

      content.querySelector
        .withArgs('div.stacked-container')
        .returns(container);

      let styler_remove_called = false;
      let context_remove_index_is_called = false;
      let group_get_fields_is_called = false;

      const styler = {
        remove: () => {
          styler_remove_called = true;
          return;
        },
      };

      const context = createContext();

      context.removeIndex = () => {
        context_remove_index_is_called = true;
      };

      const group = createGroup('foo');

      group.getExclusiveFieldNames = () => {
        group_get_fields_is_called = true;
      };

      const sut = createSut(Sut, {
        context: context,
        content: content,
        group: group,
        styler: styler,
      });

      sut.getCurrentIndex = sinon.stub().returns(10);
      sut.hasVisibleField = sinon.stub().withArgs(index).returns(false);

      const quote = createQuote();

      sut.init(quote);
      sut.removeIndex(index);

      expect(styler_remove_called).to.be.true;
      expect(context_remove_index_is_called).to.be.true;
      expect(group_get_fields_is_called).to.be.true;
    });
  });
});
