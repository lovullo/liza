/**
 * Tests miscellaneous types
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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
 * The tests here will simply fail to compile; there is no runtime test.
 */

type A0 = NominalType<number, 'A0'>;
type A1 = NominalType<A0, 'A1'>;
type A2 = NominalType<A1, 'A2'>;

// Disjoint from A*
type D = NominalType<number, 'D'>;

// Disjoint from all above
type S = NominalType<string, 'S'>;

const typeCheck = <T>(_: T) => {};

// A0, covariant
typeCheck<A0>(<A0>0);
typeCheck<A0>(<A1>0);
typeCheck<A0>(<A2>0);

// A1, covariant
// @ts-expect-error
typeCheck<A1>(<A0>0);
typeCheck<A1>(<A1>0);
typeCheck<A1>(<A2>0);

// A2, covariant
// @ts-expect-error
typeCheck<A2>(<A0>0);
// @ts-expect-error
typeCheck<A2>(<A1>0);
typeCheck<A2>(<A2>0);

// D is disjoint from A0 despite the matchin base type (number)
// @ts-expect-error
typeCheck<D>(<A0>0);

// As is S
// @ts-expect-error
typeCheck<S>(<A0>0);

// A* and D are all assignable to number
typeCheck<number>(<A0>0);
typeCheck<number>(<A1>0);
typeCheck<number>(<A2>0);
typeCheck<number>(<D>0);

// But S is not
// @ts-expect-error
<S>0;
<S>'foo';
// @ts-expect-error
typeCheck<number>(<S>'foo');
typeCheck<string>(<S>'foo');
