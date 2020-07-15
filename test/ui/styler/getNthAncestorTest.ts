/**
 *  Test case for getNthAncestor
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

import {getNthAncestor as Sut} from '../../../src/ui/styler/AncestorAwareStyler';
import {PositiveInteger} from '../../../src/numeric';
import {expect} from 'chai';

describe('ui.styler.getNthAncestor', () => {
  describe('getNthAncestor', () => {
    it('gets the nth ancestor of an element', () => {
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

      const expected = [
        <HTMLElement>container.querySelector('.foo'),
        <HTMLElement>container.querySelector('#parent'),
        <HTMLElement>container.querySelector('#gparent'),
        <HTMLElement>container.querySelector('#ggparent'),
      ];

      const target = expected[0];

      expected.forEach((elem: HTMLElement, index: number) => {
        const ancestor = Sut(target, <PositiveInteger>index);
        expect(ancestor).to.equal(elem);
      });
    });

    it("doesn't get a non-existent ancestor", () => {
      const container = document.createElement('div');

      container.innerHTML = `<div class="foo">Foo bar</div>`;

      const target = <HTMLElement>container.querySelector('.foo');
      const ancestor = Sut(target, <PositiveInteger>100);

      expect(ancestor).to.be.null;
    });
  });
});
