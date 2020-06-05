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
     * Conditionally apply styles to an HTML element
     * based on its parent and grandparent element
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

        const ggp_position = greatgrandparent.getBoundingClientRect();
        const p_position   = parent.getBoundingClientRect();

        element.style.width = greatgrandparent.offsetWidth + 'px';
        element.style.left = ( ggp_position.left - p_position.left ) + 'px';
    };
}