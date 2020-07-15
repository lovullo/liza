/**
 * Test case for FieldContext
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

import {FieldStylerFactory} from '../../../src/ui/context/styler/FieldStylerFactory';
import {FieldStyler} from '../../../src/ui/context/styler/FieldStyler';
import {FieldContextFactory as Sut} from '../../../src/ui/context/FieldContextFactory';
import {
  FieldContext,
  ContextContent,
  NullableContextContent,
} from '../../../src/ui/context/FieldContext';
import {FieldContextStore} from '../../../src/ui/context/FieldContextStore';
import {PositiveInteger} from '../../../src/numeric';
import {SubFieldContext} from '../../../src/ui/context/SubFieldContext';
import {TableCellFieldContext} from '../../../src/ui/context/TableCellFieldContext';

import {expect} from 'chai';

describe('FieldContextFactory', () => {
  [
    {
      label: 'creates new FieldContext',
      is_subfield: false,
      field_name: 'baz',
      expected: FieldContext,
    },
    {
      label: 'creates new SubFieldContext',
      is_subfield: true,
      field_name: 'baz',
      expected: SubFieldContext,
    },
  ].forEach(({label, is_subfield, field_name, expected}) => {
    it(label, () => {
      const styler_stub = getFieldStylerStub();
      const styler_factory = getFieldStylerFactory();

      let create_styler_is_called = false;

      styler_factory.create = (_: any, __: any) => {
        create_styler_is_called = true;
        return styler_stub;
      };

      const sut = new Sut(document, styler_factory);
      const content = document.createElement('div');

      const given = sut.create(
        field_name,
        <PositiveInteger>0,
        <ContextContent>content,
        is_subfield
      );

      expect(create_styler_is_called).to.be.true;
      expect(given).to.be.instanceOf(expected);
    });
  });

  it('creates new TableCellFieldContext', () => {
    const styler_factory = getFieldStylerFactory();

    const sut = new Sut(document, styler_factory);
    const table = document.createElement('table');

    table.innerHTML =
      '<tr>' +
      '<td>' +
      '<input type="text" id="q_field_0">' +
      '</td>' +
      '</tr>';

    const content = table.querySelector('td');

    const given = sut.create(
      'q_field_0',
      <PositiveInteger>0,
      <ContextContent>content,
      false
    );

    expect(given).to.be.instanceOf(TableCellFieldContext);
  });

  it('creates new FieldContextStore', () => {
    const styler_factory = getFieldStylerFactory();

    const is_internal = true;

    const sut = new Sut(document, styler_factory);
    const parent = document.createElement('div');
    parent.innerHTML =
      '<dl class="">' +
      '<dt id="qlabel_checkbox_foo" >Foo</dt>' +
      '<dd id="qcontainer_checkbox_foo">' +
      '<input type="checkbox" id="q_checkbox_foo_n_0">' +
      '</dd>' +
      '</dl>';

    const content = parent.querySelector('#qcontainer_checkbox_foo');
    const sibling = parent.querySelector('#qlabel_checkbox_foo');

    const given = sut.createStore(
      'foo',
      <ContextContent>content,
      <NullableContextContent>sibling,
      is_internal
    );

    expect(given).to.be.instanceOf(FieldContextStore);
  });
});

function getFieldStylerFactory() {
  return <FieldStylerFactory>{
    create: (_: any, __: any) => {
      return;
    },
  };
}

function getFieldStylerStub() {
  return <FieldStyler>{
    setValue: (_: any, __: any) => {},
  };
}
