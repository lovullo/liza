/**
 *  Ancestor Aware Styler
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

import { ConditionalStyler } from "./ConditionalStyler";


/**
 * Styles an HTML element based on its ancestors
 */
export class AncestorAwareStyler implements ConditionalStyler
{
    /**
     * Applies styles to an element
     *
     * Applies the following styles:
     * 1. The element takes the width of its greatgrandparnt
     * 2. The element is left aligned with its greatgrandparent
     * 3. The greatgrandparent element adds bottom margin
     *    to account for the height and position of the element
     *
     * @param element - HTML element
     */
    style( element: HTMLElement ): void
    {
        const parent = element.parentElement;
        const grandparent = parent?.parentElement ?? null;
        const greatgrandparent = grandparent?.parentElement ?? null;

        if ( parent === null || greatgrandparent === null )
        {
            return;
        }

        const ggp_rect = greatgrandparent.getBoundingClientRect();
        const p_rect   = parent.getBoundingClientRect();

        element.style.width = greatgrandparent.offsetWidth + 'px';
        element.style.left = ( ggp_rect.left - p_rect.left ) + 'px';

        const elem_rect = element.getBoundingClientRect();

        // Apply bottom margin to great grandparent to account for
        // excess height added by element
        const ggp_margin = Math.max( 0, elem_rect.bottom - ggp_rect.bottom ) + 'px';
        greatgrandparent.style.marginBottom = ggp_margin;
    };
}