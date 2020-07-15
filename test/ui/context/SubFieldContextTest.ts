/**
 * Test case for SubFieldContext
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

import {SubFieldContext as Sut} from '../../../src/ui/context/SubFieldContext';
import {ContextContent} from '../../../src/ui/context/FieldContext';
import {FieldStyler} from '../../../src/ui/context/styler/FieldStyler';

import {expect} from 'chai';

before(function () {
  this.jsdom = require('jsdom-global')();
});

after(function () {
  this.jsdom();
});

describe('SubFieldContext', () => {
  [
    {
      label: 'attaches a subfield to its parent',
      content_element_id: 'qcontainer_subfield_single',
      element_id: 'q_subfield_single_0',
      expected:
        '<dd id="qcontainer_subfield_single">' +
        '<select id="q_subfield_single_type_0" class="foo widget">' +
        '<option id="q_subfield_single_0" value="Foo">Foo</option>' +
        '</select>' +
        '</dd>',
    },
    {
      label: 'attaches a subfield to its parent after its sibling subfields',
      content_element_id: 'qcontainer_subfield',
      element_id: 'q_baz_subfield_0',
      expected:
        '<dd id="qcontainer_subfield">' +
        '<select id="q_subfield_0" class="foo widget">' +
        '<option id="q_bar_subfield_0" value="Bar">Bar</option>' +
        '<option id="q_qux_subfield_0" value="Qux">Qux</option>' +
        '<option id="q_baz_subfield_0" value="Baz">Baz</option>' +
        '</select>' +
        '</dd>',
    },
  ].forEach(({label, content_element_id, element_id, expected}) => {
    it(label, () => {
      const group_content = getGroupContent();
      const content = group_content.querySelector('#' + content_element_id);
      const sut = new Sut(
        document,
        getStylerStub(),
        element_id,
        <ContextContent>content
      );

      // First detach it
      sut.hide();
      expect(sut.isAttached()).to.be.false;

      const to_content = document.createElement('dl');
      sut.show(to_content, null);

      const final_content = sut.getFirstOfContentSet();
      expect(final_content.outerHTML).to.equal(expected);

      // Ensure isAttached is true for subfield being attached
      expect(sut.isAttached()).to.be.true;
    });
  });

  [
    {
      label: 'detaches a subfield from its parent',
      content_element_id: 'qcontainer_subfield_single',
      element_id: 'q_subfield_single_0',
      expected:
        '<dd id="qcontainer_subfield_single">' +
        '<select id="q_subfield_single_type_0" class="foo widget">' +
        '</select>' +
        '</dd>',
    },
    {
      label: 'detaches a subfield that has sibling subfields from its parent ',
      content_element_id: 'qcontainer_subfield',
      element_id: 'q_baz_subfield_0',
      expected:
        '<dd id="qcontainer_subfield">' +
        '<select id="q_subfield_0" class="foo widget">' +
        '<option id="q_bar_subfield_0" value="Bar">Bar</option>' +
        '<option id="q_qux_subfield_0" value="Qux">Qux</option>' +
        '</select>' +
        '</dd>',
    },
  ].forEach(({label, content_element_id, element_id, expected}) => {
    it(label, () => {
      const group_content = getGroupContent();
      const content = group_content.querySelector('#' + content_element_id);
      const sut = new Sut(
        document,
        getStylerStub(),
        element_id,
        <ContextContent>content
      );

      sut.hide();
      const final_content = sut.getFirstOfContentSet();
      expect(final_content.outerHTML).to.equal(expected);

      // Ensure isAttached is false when subfield is removed
      expect(sut.isAttached()).to.be.false;
    });
  });
});

function getStylerStub() {
  return <FieldStyler>{
    setValue: (_: any, __: any) => {},
  };
}

function getGroupContent() {
  // Mock group content
  var group = document.createElement('dl');

  group.innerHTML =
    '<dd id="qcontainer_subfield">' +
    '<select id="q_subfield_0" class="foo widget">' +
    '<option id="q_bar_subfield_0" value="Bar">Bar</option>' +
    '<option id="q_baz_subfield_0" value="Baz">Baz</option>' +
    '<option id="q_qux_subfield_0" value="Qux">Qux</option>' +
    '</select>' +
    '</dd>' +
    '<dd id="qcontainer_subfield_single">' +
    '<select id="q_subfield_single_type_0" class="foo widget">' +
    '<option id="q_subfield_single_0" value="Foo">Foo</option>' +
    '</select>' +
    '</dd>';

  return group;
}
