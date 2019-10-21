/**
 * Numeric types
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
 * TypeScript's type system does not support algebraic numeric domains.  A
 * compromise is to provide nominal types that allow developers to assume
 * that some constraint has been met, and then ensure that the type is only
 * ever asserted when that constraint is explicitly validated at
 * runtime.  This allows us to have compile-time checks on numeric values
 * under the assumption that the runtime will enforce them.
 *
 * For this to work, _it is important to always use type predicates_;
 * if you explicit cast to one of these numeric types, it circumvents the
 * safety provided by the system and may introduce nasty bugs, since users
 * of these types assume the provided data has already been validated.
 */

/**
  * Any number ≥ 0
  *
  * This is useful for array indexing.
  */
export type PositiveInteger = NominalType<number, 'PositiveInteger'>;


/** Whether the given number is suitable as a PositiveInteger */
export const isPositiveInteger = ( n: number ): n is PositiveInteger => n >= 0;
