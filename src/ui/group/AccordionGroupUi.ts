/**
 * Flat UI group with accordion display
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
 */

import {StackedGroupUi} from './StackedGroupUi';

declare type jQuery = any;

/**
 * Collapsable stacked group
 */
export class AccordionGroupUi extends StackedGroupUi {
  /**
   * Make stack body collapsable when header is clicked
   *
   * @param $dl   - definition list for group
   * @param index - index to make clickable
   */
  protected postAddRow($dl: jQuery, index: number): this {
    const header = $dl[0].firstElementChild;

    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('liza-collapsed');
    });

    return super.postAddRow($dl, index);
  }
}
