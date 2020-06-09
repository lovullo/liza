/**
 *  WidthAncestorAwareStyler
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
import { PositiveInteger } from "../../../src/numeric";


/**
 * Styles an HTML element's width based on an ancestor
 */
export class WidthAncestorAwareStyler implements AncestorAwareStyler
{
    /**
     * Apply an ancestor's width to the element
     *
     * @param element - target element
     * @param n       - number of generations back
     */
    public style( element: HTMLElement, generation: PositiveInteger ): void
    {
        const ancestor = getNthAncestor( element, generation );

        if ( ancestor !== null )
        {
            element.style.width = ancestor.offsetWidth + 'px';
        }
    };
}