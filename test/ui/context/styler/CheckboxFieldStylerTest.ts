/**
 * Test case for CheckboxFieldStyler
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

import {CheckboxFieldStyler as Sut} from '../../../../src/ui/context/styler/CheckboxFieldStyler';
import {PositiveInteger} from '../../../../src/numeric';

import {expect} from 'chai';

before(function () {
  this.jsdom = require('jsdom-global')();
});

after(function () {
  this.jsdom();
});

describe('CheckboxFieldStyler', () => {
  [
    {
      label: 'setValue sets value true for 2nd checkbox',
      field_name: 'foo',
      value: '1',
      html_content:
        '<input type="checkbox" value="0" data-field-name="foo" id="q_checkbox_foo_n_0">' +
        '<input type="checkbox" value="1" data-field-name="foo" id="q_checkbox_foo_y_0">',
      expected_first_checkbox: false,
      expected_second_checkbox: true,
    },
    {
      label: 'setValue sets value true for 1st checkbox',
      field_name: 'bar',
      value: '0',
      html_content:
        '<input type="checkbox" value="0" data-field-name="bar" id="q_checkbox_bar_n_0">' +
        '<input type="checkbox" value="1" data-field-name="bar" id="q_checkbox_bar_y_0">',
      expected_first_checkbox: true,
      expected_second_checkbox: false,
    },
  ].forEach(
    ({
      label,
      field_name,
      value,
      html_content,
      expected_first_checkbox,
      expected_second_checkbox,
    }) => {
      it(label, () => {
        const index = <PositiveInteger>1;

        const content = document.createElement('dd');
        content.innerHTML = html_content;

        const sut = new Sut(field_name, index);

        sut.setValue(content, value);

        // Now check the elements are the values were set
        const elements: NodeList = content.querySelectorAll(
          '[data-field-name="' + field_name + '"]'
        );

        const checkbox_1 = <HTMLInputElement>elements[0];
        const checkbox_2 = <HTMLInputElement>elements[1];

        expect(checkbox_1.checked).to.equal(expected_first_checkbox);
        expect(checkbox_2.checked).to.equal(expected_second_checkbox);
      });
    }
  );

  it('finds legacy radios in content parent element', () => {
    const index = <PositiveInteger>0;
    const field_name = 'supplier';
    const value = 'Dewey';

    // Simulate the td content has a parent row
    // where the inputs we are searching for
    // are found in the content and a sibling in its parent
    const parentContent = document.createElement('tr');

    const content = document.createElement('td');
    content.innerHTML =
      '<input type="radio" value="Huey" id="q_supplier_bar_0" data-field-name="supplier">';

    const content2 = document.createElement('td');
    content2.innerHTML =
      '<input type="radio" value="Dewey" id="q_supplier_foo_0" data-field-name="supplier">';

    parentContent.appendChild(content);
    parentContent.appendChild(content2);

    const sut = new Sut(field_name, index);

    sut.setValue(content, value);

    // Now check the elements are the values were set
    const elements: NodeList = parentContent.querySelectorAll(
      '[data-field-name="' + field_name + '"]'
    );

    const radio_1 = <HTMLInputElement>elements[0];
    const radio_2 = <HTMLInputElement>elements[1];

    expect(radio_1.checked).to.equal(false);
    expect(radio_2.checked).to.equal(true);
  });
});
