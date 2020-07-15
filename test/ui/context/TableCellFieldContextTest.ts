/**
 * Test case for TableCellFieldContext
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

import {TableCellFieldContext as Sut} from '../../../src/ui/context/TableCellFieldContext';
import {ContextContent} from '../../../src/ui/context/FieldContext';
import {FieldStyler} from '../../../src/ui/context/styler/FieldStyler';

import {expect} from 'chai';

before(function () {
  this.jsdom = require('jsdom-global')();
});

after(function () {
  this.jsdom();
});

describe('TableCellFieldContext', () => {
  it('show sets visible to true', () => {
    const group = getGroupContent();

    const content = group.querySelector('#q_table_row_0');
    const sut = new Sut(
      document,
      getStylerStub(),
      'q_field_0',
      <ContextContent>content
    );

    const to = document.createElement('tr');
    sut.show(to, null);

    expect(sut.isVisible()).to.be.true;
  });

  it('shows field and attaches to DOM when show is called for cloned content', () => {
    // Mock that the content has no parent, so is not attached
    const content = document.createElement('td');

    const sut = new Sut(
      document,
      getStylerStub(),
      'foo_bar',
      <ContextContent>content
    );

    expect(sut.isAttached()).to.be.false;

    const to = document.createElement('tr');
    sut.show(to, null);

    expect(sut.isAttached()).to.be.true;
    expect(sut.isVisible()).to.be.true;
  });

  it('hide sets visible to false', () => {
    const group = getGroupContent();

    const content = group.querySelector('#q_table_row_0');
    const sut = new Sut(
      document,
      getStylerStub(),
      'q_foo_row_0',
      <ContextContent>content
    );

    sut.hide();

    expect(sut.isVisible()).to.be.false;
  });
});

function getStylerStub() {
  return <FieldStyler>{
    setValue: (_: any, __: any) => {},
  };
}

function getGroupContent() {
  // Mock group content
  var group = document.createElement('div');

  group.innerHTML =
    '<table>' +
    '<tr id="q_table_row_0">' +
    '<td>' +
    '<input type="text" id="q_foo_row_0">' +
    '</td>' +
    '<td>' +
    '<div>' +
    '<label>' +
    '<input type="checkbox" data-field-name="table_row"> No' +
    '</label>' +
    '</div>' +
    '</td>' +
    '</tr>' +
    '</table>';

  return group;
}
