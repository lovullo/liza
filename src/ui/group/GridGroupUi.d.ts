/**
 * Grid Group UI logic
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
import { GroupUi } from "./GroupUi";
import { ConditionalStyler } from "../styler/ConditionalStyler";

export declare class GridGroupUi extends GroupUi
{
    public areDetailsOpen(): boolean;

    public closeDetails( styler: ConditionalStyler ): void;

    public deselect(): void;

    public getCategories(): string[];

    public getXType(): string;

    public isSelected(): boolean;

    public isVisible(): boolean;

    public openDetails( styler: ConditionalStyler ): void;

    public select(): void;
}