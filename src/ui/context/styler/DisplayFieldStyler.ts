/**
 * Liza Default Field Styler
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

import {PositiveInteger} from '../../../numeric';
import {ContextContent} from '../FieldContext';
import {FieldStyler} from './FieldStyler';
import {ElementStyler} from '../../ElementStyler';

const EventEmitter = require('events').EventEmitter;

/**
 * Styles display/answer fields
 *
 * Currently a passthrough to ElementStyler until
 * the logic to style displays/answers can be moved here
 */
export class DisplayFieldStyler extends EventEmitter implements FieldStyler {
  /**
   * Initialize DisplayFieldStyler
   *
   * @param element_styler element styler
   * @param name field name
   * @param index field index
   */
  constructor(
    protected readonly element_styler: ElementStyler,
    protected readonly name: string,
    protected readonly index: PositiveInteger
  ) {
    super();
  }

  /**
   * Set value of the display/answer field
   *
   * @param content - field content
   * @param value - value to set
   */
  setValue(content: ContextContent, value: string): void {
    const elements: NodeList = content.querySelectorAll(
      `[data-field-name="${this.name}"]`
    );

    var i = elements.length;

    while (i--) {
      const element = <ContextContent>elements[i];

      const ref_id = element.getAttribute('data-answer-ref');

      if (ref_id === null) {
        throw TypeError(`Display for ${this.name} is missing an answer ref`);
      }

      const display_value = this.element_styler.styleAnswer(ref_id, value);

      const allow_html = element.getAttribute('data-field-allow-html') || '';

      if (allow_html === 'true') {
        element.innerHTML = display_value;
      } else {
        element.textContent = display_value;
      }

      this.emit('displayChanged', this.name, this.index, value);
    }
  }
}
