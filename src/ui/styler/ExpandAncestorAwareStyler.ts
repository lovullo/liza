/**
 *  ExpandAncestorAwareStyler
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

import {AncestorAwareStyler, getNthAncestor} from './AncestorAwareStyler';
import {PositiveInteger} from '../../numeric';

/**
 * Expand an HTML element's ancestor's size
 */
export class ExpandAncestorAwareStyler implements AncestorAwareStyler {
  /**
   * Expand an ancestor to account for spill-over caused by the element
   *
   * @param element - target element
   * @param n       - number of generations back
   */
  public style(element: HTMLElement, generation: PositiveInteger): void {
    const ancestor = getNthAncestor(element, generation);

    if (!ancestor) {
      return;
    }

    const ancestor_rect = ancestor.getBoundingClientRect();
    const element_rect = element.getBoundingClientRect();

    const margin = Math.max(0, element_rect.bottom - ancestor_rect.bottom);

    ancestor.style.marginBottom = `${margin}px`;
  }
}
