/**
 *  Ancestor-Aware Styler
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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
 */

import {PositiveInteger} from '../../../src/numeric';

/**
 * HTMLElement type that allows null values
 */
export type NullableHTMLElement = HTMLElement | null;

/**
 * Helper to get nth ancestor
 *
 * @param element - target element
 * @param n       - number of generations back
 *
 * @return the element's ancestor
 */
export const getNthAncestor = (
  element: HTMLElement,
  n: PositiveInteger
): NullableHTMLElement => {
  while (element.parentNode && n-- > 0) {
    element = <HTMLElement>element.parentNode;
  }

  return n > 0 ? null : element;
};

/**
 * Interface for conditional styling
 */
export interface AncestorAwareStyler {
  /**
   * Conditionally apply a style to an HTML element based on an ancestor
   */
  style(elem: HTMLElement, generation: PositiveInteger): void;
}
