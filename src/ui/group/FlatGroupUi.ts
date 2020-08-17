/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off" */
/**
 * Group UI rendering only the first index
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

import {GroupUi} from './GroupUi';
import {ClientQuote} from '../../client/quote/ClientQuote';

/**
 * Renders only the first index of fields in a flat group that does not
 * support any means of adding or removing indexes.
 */
export class FlatGroupUi extends GroupUi {
  /**
   * Process group before initial display
   */
  protected processContent(_quote?: ClientQuote): void {
    // Sets the parent element
    this.fieldContentParent[0] = <HTMLElement>this.content.querySelector('dl');

    this.context.createFieldCache();
  }

  /**
   * This group does not support multiple indexes
   *
   * @return false
   */
  protected supportsMultipleIndex(): boolean {
    return false;
  }

  /**
   * Permit adding only a single index
   *
   * @param index - index that has been added
   */
  protected addIndex(index: number): this {
    if (index > 0) {
      return this;
    }

    return super.addIndex(index);
  }

  /**
   * Permit removing only the first index
   *
   * This follows from #addIndex, since only one will ever exist.
   *
   * @param index - index that has been removed
   */
  protected removeIndex(index: number): this {
    if (index > 0) {
      return this;
    }

    return super.removeIndex(index);
  }
}
