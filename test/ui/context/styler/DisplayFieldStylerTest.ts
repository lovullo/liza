/**
 * Test case for DisplayFieldStyler
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

import {DisplayFieldStyler as Sut} from '../../../../src/ui/context/styler/DisplayFieldStyler';
import {PositiveInteger} from '../../../../src/numeric';
import {ElementStyler} from '../../../../src/ui/ElementStyler';

import {expect} from 'chai';

before(function () {
  this.jsdom = require('jsdom-global')();
});

after(function () {
  this.jsdom();
});

describe('DisplayFieldStyler', () => {
  [
    {
      label: 'setValue calls ElementStyler to style one answer',
      field_name: 'foo',
      answer_ref: 'bar',
      value: '1',
      display_value: 'New York',
      html_content:
        '<span data-field-name="foo" id="foo_dca320"' +
        'data-answer-ref="bar"></span>',
      expected_calls: 1,
    },
    {
      label: 'setValue calls ElementStyler to style two answers',
      field_name: 'foo',
      answer_ref: 'bar',
      value: '1',
      display_value: 'Detroit',
      html_content:
        '<span data-field-name="foo" id="foo_dca320"' +
        'data-answer-ref="bar"></span>' +
        '<span data-field-name="foo" id="foobar_dca320"' +
        'data-answer-ref="bar"></span>',
      expected_calls: 2,
    },
  ].forEach(
    ({
      label,
      field_name,
      answer_ref,
      value,
      display_value,
      html_content,
      expected_calls,
    }) => {
      it(label, () => {
        const index = <PositiveInteger>1;
        let style_answer_call_count = 0;

        const element_styler = getElementStylerStub();
        const sut = new Sut(element_styler, field_name, index);

        element_styler.styleAnswer = (ref_id: string, value_to_set: string) => {
          style_answer_call_count++;

          expect(ref_id).to.equal(answer_ref);
          expect(value_to_set).to.equal(value);

          return display_value;
        };

        const content = document.createElement('dd');
        content.innerHTML = html_content;
        sut.setValue(content, value);

        expect(style_answer_call_count).to.equal(expected_calls);
      });
    }
  );

  [
    {
      label: 'setValue styles answer as HTML',
      field_name: 'foo',
      value: '1',
      display_value: 'New York',
      html_content:
        '<span data-field-name="foo" id="foo_dca320"' +
        ' data-answer-ref="bar" data-field-allow-html="true"></span>',
      expected_html:
        '<dd><span data-field-name="foo" id="foo_dca320"' +
        ' data-answer-ref="bar" data-field-allow-html="true">New York</span></dd>',
      expected_textcontent: 'New York',
    },
    {
      label: 'setValue styles answer as text',
      field_name: 'foo',
      value: '1',
      display_value: 'Detroit',
      html_content:
        '<span data-field-name="foo" id="foo_dca320"' +
        ' data-answer-ref="bar"></span>',
      expected_html:
        '<dd><span data-field-name="foo" id="foo_dca320"' +
        ' data-answer-ref="bar">Detroit</span></dd>',
      expected_textcontent: 'Detroit',
    },
  ].forEach(
    ({
      label,
      field_name,
      value,
      display_value,
      html_content,
      expected_html,
      expected_textcontent,
    }) => {
      it(label, () => {
        const index = <PositiveInteger>1;

        const element_styler = getElementStylerStub();
        const sut = new Sut(element_styler, field_name, index);

        element_styler.styleAnswer = (_: any, __: any) => {
          return display_value;
        };

        const content = document.createElement('dd');
        content.innerHTML = html_content;
        sut.setValue(content, value);

        const element = content.querySelector(
          '[data-field-name="' + field_name + '"]'
        );

        expect(element?.textContent).to.equal(expected_textcontent);

        expect(content?.outerHTML as string).to.equal(expected_html);
      });
    }
  );
});

function getElementStylerStub() {
  return <ElementStyler>{
    getDefault: (_: any) => {},
    styleAnswer: (_: any, __: any) => {},
  };
}
