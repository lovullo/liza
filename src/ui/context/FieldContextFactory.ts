/* TODO auto-generated eslint ignore, please fix! */
/* eslint @typescript-eslint/no-inferrable-types: "off" */
/**
 * Liza Field Context Factory
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

import {
  FieldContext,
  ContextContent,
  NullableContextContent,
} from './FieldContext';
import {FieldContextStore} from './FieldContextStore';
import {PositiveInteger} from '../../numeric';
import {SubFieldContext} from './SubFieldContext';
import {TableCellFieldContext} from './TableCellFieldContext';
import {FieldStylerFactory} from './styler/FieldStylerFactory';

export class FieldContextFactory {
  /**
   * Field element ID prefix
   */
  private _field_id_prefix: string = 'q_';

  /**
   * Initialize FieldContextFactory
   *
   * @param _document - DOM
   */
  constructor(
    private readonly _document: Document,
    private readonly _styler_factory: FieldStylerFactory
  ) {}

  /**
   * Creates a new FieldContext
   *
   * @param name - field name
   * @param index - field index
   * @param content - field HTML content
   * @param is_subfield - field represents a subfield
   * @param sibling - field HTML sibling content
   */
  create(
    name: string,
    index: PositiveInteger,
    content: ContextContent,
    is_subfield: boolean,
    sibling: NullableContextContent = null
  ): FieldContext {
    const element_id = this._field_id_prefix + name + '_' + index;

    let obj = FieldContext;
    if (is_subfield) {
      obj = SubFieldContext;
    } else if (content.tagName === 'TD') {
      obj = TableCellFieldContext;
    }

    return new obj(
      this._document,
      this._styler_factory.create(name, index),
      element_id,
      content,
      sibling
    );
  }

  /**
   * Creates a new FieldContextStore
   *
   * @param name - field name
   * @param content - field HTML content
   * @param sibling - field HTML sibling content
   * @param is_internal - if user is internal
   */
  createStore(
    name: string,
    content: ContextContent,
    sibling: NullableContextContent = null,
    is_internal: boolean = false
  ): FieldContextStore {
    const element_id = this._field_id_prefix + name + '_0';

    return new FieldContextStore(element_id, content, sibling, is_internal);
  }
}
