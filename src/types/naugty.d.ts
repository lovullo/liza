/**
 * Things that should only be used when absolutely necessary
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * DEFINITIONS IN THIS PACKAGE DO NAUGHTY THINGS THAT CIRCUMVENT TYPE
 * SAFETY; THEY SHOULD BE USED ONLY WHEN NECESSARY, AND ONLY WHEN YOU KNOW
 * WHAT YOU'RE DOING, SINCE THEY MAY INTRODUCE BUGS!
 *
 * The prefix `___` is added to each of the names here so that code can be
 * easily searched for uses of naughty things.
 *
 * These types are also exported, unlike some other `.d.ts` files which are
 * universally available during complication---this forces the importing of
 * this file, named `naughty.d.ts`, which should raise some eyebrows and
 * make people less likely to copy existing code that uses it.
 */

declare module 'naughty'
{
    /**
     * Make type `T` writable while otherwise maintaining type safety
     *
     * _Only use this generic if you are the owner of the object being
     * manipulated!__
     *
     * This should be used when we want types to be readonly, but we need to
     * be able to modify an existing object to initialize the
     * properties.  This should only be used in situations where it's not
     * feasible to add those properties when the object is first created.
     */
    export type ___Writable<T> = { -readonly [K in keyof T]: T[K] };
}
