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

export type FieldElement = HTMLInputElement;
export type NullableFieldElement = FieldElement | null;

/**
 * Styles DOM fields
 */
export class DefaultFieldStyler implements FieldStyler {
  /**
   * Field element ID prefix
   */
  private _field_id_prefix: string = 'q_';

  /**
   * Initialize DefaultFieldStyler
   *
   * @param name field name
   * @param index field index
   */
  constructor(
    protected readonly name: string,
    protected readonly index: PositiveInteger
  ) {}

  /**
   * Set value of the field
   *
   * @param content - field content
   * @param value - value to set
   */
  setValue(content: ContextContent, value: string): void {
    const element = this._getElement(content);

    if (element !== null) {
      element.value = '' + value;
    }
  }

  /**
   * Get field element
   *
   * @param content - field content
   */
  private _getElement(content: ContextContent): NullableFieldElement {
    const id = this._field_id_prefix + this.name + '_' + this.index;

    const element = <NullableFieldElement>content.querySelector('#' + id);

    if (element !== null) {
      return element;
    }

    // In case the element is not found by id, we can query by data-field-name.
    // The index is not needed because the content is at the field level
    return <NullableFieldElement>(
      content.querySelector(`[data-field-name="${this.name}"]`)
    );
  }
}
