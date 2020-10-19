/**
 * Test case for NavStylerManager
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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

const expect = require('chai').expect;

import {NavStyler} from '../../../src/ui/nav/NavStyler';
import {NavStylerManager as Sut} from '../../../src/ui/nav/NavStylerManager';

describe('NavStylerManager', () => {
  describe('Calls delegate stylers', () => {
    it('#highlightStep', () => {
      let highlight_step_call_count = 0;

      const step_id = 123;

      const highlightStepFunc = (id: number) => {
        expect(id).to.equal(step_id);
        highlight_step_call_count++;
      };

      const styler_a = <NavStyler>(<unknown>{highlightStep: highlightStepFunc});
      const styler_b = <NavStyler>(<unknown>{highlightStep: highlightStepFunc});

      new Sut([styler_a, styler_b]).highlightStep(step_id);

      expect(highlight_step_call_count).to.equal(2);
    });

    it('#quoteLocked', () => {
      let quote_locked_call_count = 0;

      const locked = true;

      const quoteLockedFunc = (given: boolean) => {
        expect(given).to.equal(locked);
        quote_locked_call_count++;
      };

      const styler_a = <NavStyler>(<unknown>{quoteLocked: quoteLockedFunc});
      const styler_b = <NavStyler>(<unknown>{quoteLocked: quoteLockedFunc});

      new Sut([styler_a, styler_b]).quoteLocked(locked);

      expect(quote_locked_call_count).to.equal(2);
    });
  });
});
