/**
 *  Test case for LeftAlignAncestorAwareStyler
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

import {LeftAlignAncestorAwareStyler as Sut} from '../../../src/ui/styler/LeftAlignAncestorAwareStyler';
import {PositiveInteger} from '../../../src/numeric';
import {expect} from 'chai';
const sinon = require('sinon');

before(function () {
  this.jsdom = require('jsdom-global')();
});

after(function () {
  this.jsdom();
});

describe('ui.styler.LeftAlignAncestorAwareStyler', () => {
  describe('style', () => {
    it('sets left of the element based on its ancestors', () => {
      const container = document.createElement('div');

      container.innerHTML = `<div id="ggparent">
                    <div id="gparent">
                        <div id="parent">
                            <div class="foo">
                                Foo bar
                            </div>
                        </div>
                    </div>
                </div>`;

      const element = <HTMLElement>container.querySelector('.foo');
      const ggparent = <HTMLElement>container.querySelector('#ggparent');

      element.getBoundingClientRect = sinon.stub().returns({left: 800});
      ggparent.getBoundingClientRect = sinon.stub().returns({left: 500});

      if (element === null) {
        throw new Error('Unable to find element');
      }

      const sut = new Sut();
      sut.style(element, <PositiveInteger>3);

      expect(element.style.left).to.equal('-300px');
    });

    it('does not set left if element has no parent', () => {
      const container = document.createElement('div');

      container.innerHTML = `<div class="foo">
                    Foo bar
                </div>`;

      const element = <HTMLElement>container.querySelector('.foo');

      if (element === null) {
        throw new Error('Unable to find element');
      }

      const sut = new Sut();
      sut.style(element, <PositiveInteger>2);

      expect(element.style.left).to.equal('');
    });
  });
});
