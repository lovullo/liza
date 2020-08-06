/* TODO auto-generated eslint ignore, please fix! */
/* eslint @typescript-eslint/no-inferrable-types: "off", prefer-const: "off" */
/**
 * Liza Group Context
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

import {ContextParser} from './ContextParser';
import {
  FieldContext,
  ContextContent,
  NullableContextContent,
  FieldOptions,
} from './FieldContext';
import {FieldContextStore} from './FieldContextStore';
import {FieldContextFactory} from './FieldContextFactory';
import {PositiveInteger} from '../../numeric';

export type ContextCache = Record<string, FieldContext[]>;

export type ContextStores = Record<string, FieldContextStore>;

/**
 * Context responsible for a group and its fields
 */
export class GroupContext {
  /**
   * Cache of FieldContexts
   */
  private _field_context_cache: ContextCache = {};

  /**
   * Object containing FieldContextStore for each field
   */
  private _field_context_stores: ContextStores = {};

  /**
   * Position of all cached fields
   */
  private _field_positions: string[] = [];

  /**
   * Non-cmatch field names
   */
  private _non_cmatch_fields: string[] = [];

  /**
   * Initialize GroupContext
   *
   * @param _parser - ContextParser
   * @param _field_context_factory - field context factory
   */
  constructor(
    private readonly _parser: ContextParser,
    private readonly _field_context_factory: FieldContextFactory
  ) {}

  /**
   * Create cache of field context stores
   * and initialize field arrays
   *
   * @param fields - exclusive field names of group
   * @param cmatch_fields - exclusive cmatch field names of group
   * @param content - group content
   * @param is_internal if user is internal
   */
  init(
    fields: string[],
    cmatch_fields: string[],
    content: ContextContent,
    is_internal: boolean = false
  ): void {
    const cmatch_fields_set = new Set(cmatch_fields);

    this._non_cmatch_fields = fields.filter(
      field => !cmatch_fields_set.has(field)
    );

    for (let i = 0; i < fields.length; i++) {
      let field = fields[i];

      let field_content = this._parser.parse(field, content);

      if (field_content !== null) {
        let sibling_content = this._parser.findSiblingContent(field_content);

        // Create the FieldContextStore
        let field_store = this._field_context_factory.createStore(
          field,
          field_content,
          sibling_content,
          is_internal
        );

        // Only non-subfields should store the position in GroupContext
        if (field_store.isSubField() === false) {
          let position = field_store.position;
          this._field_positions[position] = field;
        }

        this._field_context_stores[field] = field_store;
      }
    }
  }

  /**
   * Create cache of field contexts
   *
   * This should only be called by Groups that do not
   * support multiple indexes
   */
  createFieldCache(): void {
    for (let field in this._field_context_stores) {
      const store = this._field_context_stores[field];

      // Index is 0 for the initial fields
      const index = <PositiveInteger>0;

      const is_subfield = store.isSubField();

      const field_context = this._field_context_factory.create(
        field,
        index,
        store.content,
        is_subfield,
        store.siblingContent
      );

      this._field_context_cache[field] = [];

      this._field_context_cache[field][index] = field_context;
    }
  }

  /**
   * Shows default fields for a new index
   *
   * Only non-cmatch fields should be attached initially
   *
   * @param index - field index
   * @param to - parent content
   */
  addIndex(index: PositiveInteger, to: ContextContent): void {
    for (let i = 0; i < this._non_cmatch_fields.length; i++) {
      const field_name = this._non_cmatch_fields[i];

      this.show(field_name, index, to);
    }
  }

  /**
   * Detaches content from the FieldContextStores
   * for specific fields that have cmatches
   *
   * The purpose of this is to reduce the number of
   * DOM elements in the parent of the content
   * in the FieldContextStore before the parent
   * is cloned for each index
   *
   * This method can be optionally called by
   * GroupUi and its subtypes to improve performance
   *
   * @param fields - cmatch field names of group
   */
  detachStoreContent(fields: string[]): void {
    for (let i = 0; i < fields.length; i++) {
      let field = fields[i];

      let store = this._field_context_stores[field];

      if (store !== undefined) {
        store.detach();
      }
    }
  }

  /**
   * Remove the last index from the field context cache
   *
   * @param fields - exclusive field names of group
   * @param index - index to remove
   */
  removeIndex(fields: string[], index: PositiveInteger): void {
    for (let i = 0; i < fields.length; i++) {
      let field = fields[i];
      if (
        this._field_context_cache[field] === undefined ||
        this._field_context_cache[field][index] === undefined
      ) {
        continue;
      }

      // Remove the last index
      this._field_context_cache[field].pop();
    }
  }

  /**
   * Set the value if attached to the DOM
   * or store the value so it can be used later
   *
   * @param field_name - field name
   * @param index - field index
   * @param value - field value
   */
  setValueByName(
    field_name: string,
    index: PositiveInteger,
    value: string
  ): void {
    if (this.isFieldAttached(field_name, index)) {
      const field_context = this._fromCache(field_name, index);
      field_context.setValue(value);
    } else {
      const store = this._field_context_stores[field_name];

      if (store !== undefined) {
        store.setValueByIndex(index, value);
      }
    }
  }

  /**
   * Return if the field is attached to the DOM
   *
   * @param field_name - field name
   * @param index - field index
   */
  isFieldAttached(field_name: string, index: PositiveInteger): boolean {
    if (
      this._field_context_cache[field_name] === undefined ||
      this._field_context_cache[field_name][index] === undefined
    ) {
      return false;
    }

    const field_context = this._fromCache(field_name, index);

    return field_context.isAttached();
  }

  /**
   * Set Options on Select elements
   *
   * If the field is not attached, store the options and value
   * in the FieldContextStore to be retrieved when shown
   *
   * @param field_name - to attach options to
   * @param index - field index
   * @param options - list of options to set
   * @param value - value to set once options exist
   */
  setOptions(
    field_name: string,
    index: PositiveInteger,
    options: FieldOptions,
    val: string
  ): void {
    if (this.isFieldAttached(field_name, index)) {
      const field_context = this._fromCache(field_name, index);
      field_context.setOptions(options, val);
    } else {
      const store = this._field_context_stores[field_name];

      if (store !== undefined) {
        store.setOptionsByIndex(index, options);
        store.setValueByIndex(index, val);
      }
    }
  }

  /**
   * Show field on the DOM
   *
   * Set the value and options of the field if stored
   *
   * @param field_name - to attach to DOM
   * @param index - field index
   * @param to - parent content
   */
  show(field_name: string, index: PositiveInteger, to: ContextContent): void {
    // If field name was never added to a store, do nothing
    if (this._field_context_stores[field_name] === undefined) {
      return;
    }

    const field_context = this._fromCache(field_name, index);

    if (field_context.isVisible() === false) {
      field_context.show(to, this._getNextElement(field_name, index));

      const store = this._field_context_stores[field_name];

      if (store.hasOptionsByIndex(index)) {
        field_context.setOptions(
          store.getOptionsByIndex(index),
          store.getValueByIndex(index)
        );
      }

      if (store.hasValueByIndex(index)) {
        field_context.setValue(store.getValueByIndex(index));
      }
    }
  }

  /**
   * Hide field from DOM
   *
   * @param field_name - to detach from DOM
   * @param index - field index
   */
  hide(field_name: string, index: PositiveInteger): void {
    // If field name was never added to a store, do nothing
    if (this._field_context_stores[field_name] === undefined) {
      return;
    }

    const store = this._field_context_stores[field_name];

    // If the field is a subfield, we need its parent
    // context to be created and then the subfield,
    // so it can be detached
    if (store.isSubField() === true) {
      // Get the parent field context
      const parent_name = store.subFieldParentName;

      // create the parent field context if not defined
      this._fromCache(parent_name, index);

      const subfield_context = this._fromCache(field_name, index);

      subfield_context.hide();
    }

    // If FieldContext was never added to cache, do nothing
    if (
      this._field_context_cache[field_name] === undefined ||
      this._field_context_cache[field_name][index] === undefined
    ) {
      return;
    }

    this._field_context_cache[field_name][index].hide();
  }

  /**
   * Return FieldContext from cache, or create a new one
   * and save it to the cache
   *
   * @param field_name - field name
   * @param index - field index
   *
   * @returns cached FieldContext
   */
  private _fromCache(field_name: string, index: PositiveInteger): FieldContext {
    if (
      this._field_context_cache[field_name] !== undefined &&
      this._field_context_cache[field_name][index] !== undefined
    ) {
      return this._field_context_cache[field_name][index];
    }

    // Retrieve cloned nodes from the FieldContextStore
    const store = this._field_context_stores[field_name];

    let field_content = store.getContentClone(index);
    const sibling_content = store.getSiblingContentClone(index);
    const is_subfield = store.isSubField();

    // If it's a subfield, grab the content from its parent
    // We don't want a new clone in this scenario
    if (is_subfield === true) {
      const parent_name = store.subFieldParentName;
      const parent_context = this._fromCache(parent_name, index);
      field_content = parent_context.getContent();
    }

    const field_context = this._field_context_factory.create(
      field_name,
      index,
      field_content,
      is_subfield,
      sibling_content
    );

    if (this._field_context_cache[field_name] === undefined) {
      this._field_context_cache[field_name] = [];
    }

    this._field_context_cache[field_name][index] = field_context;

    return field_context;
  }

  /**
   * Determine the next attached element to attach before
   *
   * @param field_name - of element to find next element
   * @param index - field index
   *
   * @returns the Context of the next visible element
   */
  private _getNextElement(
    field_name: string,
    index: PositiveInteger
  ): NullableContextContent {
    const store = this._field_context_stores[field_name];
    let position: PositiveInteger = store.position;

    position++;

    for (let i = position; i < this._field_positions.length; i++) {
      if (this._field_positions[i] !== undefined) {
        let next_element_name = this._field_positions[i];
        let next_context = this._field_context_cache[next_element_name];

        if (
          next_context !== undefined &&
          next_context[index] !== undefined &&
          next_context[index].isAttached()
        ) {
          return next_context[index].getFirstOfContentSet();
        }
      }
    }

    return null;
  }
}
