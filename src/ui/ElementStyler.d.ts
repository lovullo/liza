/**
 * Archaic DOM element styler
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of liza.
 *
 *  liza is free software: you can redistribute it and/or modify
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
 *
 * @needsLove
 *   - Everything!  This class exists from when the framework was barely
 *     more than a few prototypes and has rotted ever since with little else
 *     but workarounds.
 * @end needsLove
 */

/**
 * Styles DOM elements
 *
 * This class styles DOM elements with Dojo's Dijits (widgets).
 *
 * @return void
 */
export declare class ElementStyler {
  /**
   * Retrieve default bucket value for an element
   */
  getDefault(name: string): string;

  /**
   * Retrieve value for display/answer based on ref_id
   */
  styleAnswer(ref_id: string, name: string): string;

  /**
   * Returns the element with the name attribute
   *
   * This allows referencing the element that should be posted
   *
   * @return jQuery named element
   */
  getNameElement($element: any): any;

  /**
   * Retrieve an answer element
   *
   * @param name     - element name
   * @param index    - element index
   * @param filter   - a filter to apply when searching
   * @param $context - context for the element
   *
   * @return An answer element
   */
  getAnswerElementByName(
    name: string,
    index: number | undefined,
    filter: any,
    $context: any
  ): any;

  /**
   * Called after the content is appended to the DOM for the first time
   *
   * This is used to do final processing for display. In this case, performing
   * the actual styling based off of the previously set attributes.
   *
   * @param $content - content to append
   */
  postAppend($content: any): this;

  /**
   * Get the index for a given element
   *
   * @param name     - element name
   * @param index    - element index
   * @param $context - context for the element
   *
   * @return proper element index
   */
  getProperIndex(
    name: string,
    index: number | undefined,
    $context?: any
  ): number;

  /**
   * Retrieve widgets by the given name and optional index
   *
   * This allows for a simple mapping from bucket to UI.
   *
   * @param name    - element name (question name)
   * @param index   - index of element to retrieve (bucket index)
   * @param filter  - filter to apply to widgets
   * @param context - filtering context
   *
   * @return matches
   */
  getWidgetByName(
    name: string,
    index: number,
    filter?: string | null,
    context?: any
  ): any;

  /**
   * Focuses on an element and optionally displays the tooltip
   *
   * @param $element     - element to focus on
   * @param tooltip      - whether to display the tooltip
   * @param tooltip_text - text to display on tooltip (optional)
   */
  focus($element: any, tooltip: boolean, tooltip_text: string): this;

  /**
   * Disable the given field
   *
   * @param name    - field name
   * @param index   - field index
   * @param disable - whether to disable (default true)
   * @param context - field context
   */
  disableField(
    name: string,
    index?: number,
    disable?: boolean,
    $context?: any
  ): this;

  setOptions(
    name: string,
    index: number,
    options: any[],
    val?: string,
    $context?: any
  ): void | this;

  /**
   * Sets element value given a name and index
   *
   * @param name         - element name
   * @param index        - index to set
   * @param value        - value to set
   * @param change_event - whether to trigger change event
   * @param $context     - optional DOM element context
   */
  setValueByName(
    name: string,
    index: number,
    value: string,
    change_event: boolean,
    $context: any
  ): this;

  isAField(name: string): boolean;

  /**
   * Retrieve elements by the given name and optional index
   *
   * This allows for a simple mapping from bucket to UI.
   *
   * If multiple elements exist for a group of elements (e.g. radios), the
   * first element in the group will be returned.
   *
   * @param name     - element name (question name)
   * @param index    - index of element to retrieve (bucket index)
   * @param filter   - filter to apply to widgets
   * @param $context - filtering context
   *
   * @return matches
   */
  getElementByName(
    name: string,
    index: number,
    filter: string | undefined,
    $context: any
  ): any;

  /**
   * Applies the style to all DOM elements that are descendants of content
   *
   * @param content - parent element containing elements to style
   */
  apply(content: any): this;

  /**
   * Removes the element identified by the given id from the DOM
   *
   * This will ensure that styled elements are also removed from memory, so
   * that the same id can later be styled if it is readded.
   *
   * If the element is not styled, this method will fall back on jQuery to
   * attempt to locate and remove it.
   */
  remove(id: any): this;
}
