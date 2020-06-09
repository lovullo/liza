/**
 *  LeftAlignAncestorAwareStyler
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

import { AncestorAwareStyler, getNthAncestor } from "./AncestorAwareStyler";
import { PositiveInteger } from "../../numeric";


/**
 * Styles an HTML element's left position based on an ancestor
 */
export class LeftAlignAncestorAwareStyler implements AncestorAwareStyler
{
    /**
     * Align the element with an ancestor by adjusting its left positon
     *
     * @param element - target element
     * @param n       - number of generations back
     */
    public style( element: HTMLElement, generation: PositiveInteger ): void
    {
        const ancestor = getNthAncestor( element, generation );

        if ( !ancestor )
        {
            return;
        }

        /**
         * Reset style.left when it is out of sync with DOMRect.left
         *
         * If this styler is applied while the element is hidden, it will use
         * a DOMRect.left of 0 which applies an inaccurate style.left to the
         * element. As a result, the next time the styler is applied, it will
         * continue as if the origin of the target element has been relocated to
         * the previously set style.left.
         */
        element.style.left = '0px';

        const ancestor_rect = ancestor.getBoundingClientRect();
        const element__rect = element.getBoundingClientRect();
        element.style.left = ( ancestor_rect.left - element__rect.left ) + 'px';
    };
}