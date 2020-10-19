/**
 * Test case for MobileNav
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

import {MobileNav as Sut} from '../../../src/ui/nav/MobileNav';

describe('MobileNav', () => {
  it('sets onclick handlers', () => {
    const {header, steps, sections, nav_menu} = getMocks();

    new Sut(nav_menu);

    expect(header.onclick).to.not.equal(undefined);
    expect(steps[0].onclick).to.not.equal(undefined);
    expect(sections[0].onclick).to.not.equal(undefined);
  });

  it('stops initializing if required elements are not found', () => {
    const {nav_menu, header} = getMocks();

    nav_menu.getElementsByClassName = (selector: string) => {
      switch (selector) {
        case 'mobile-nav':
          return <HTMLCollectionOf<HTMLElement>>(<unknown>[null]);
        default:
          return <HTMLCollectionOf<HTMLElement>>(<unknown>[header]);
      }
    };

    new Sut(nav_menu);

    expect(header.onclick).to.be.undefined;
  });

  describe('#stepChanged', () => {
    it('updates header text', () => {
      const {header, nav_menu} = getMocks();

      const sut = new Sut(nav_menu);

      sut.stepChanged('foo');

      expect(header.innerHTML).to.equal('<span>foo</span>');
    });
  });

  describe('#stepChanged', () => {
    it('hides nav', () => {
      const {nav, nav_menu} = getMocks();

      let add_class_called = false;

      nav.classList.add = () => {
        add_class_called = true;
      };

      const sut = new Sut(nav_menu);

      sut.stepChanged('foo');

      expect(add_class_called).to.be.true;
    });
  });
});

function getMocks() {
  const sections = getSectionElements();
  const steps = getStepElements();
  const nav = getNavElement(steps, sections);
  const header = getNavHeaderElement();
  const nav_menu = getNavMenu(nav, header);

  return {
    sections: sections,
    steps: steps,
    nav: nav,
    header: header,
    nav_menu: nav_menu,
  };
}

function getNavMenu(nav: HTMLElement, header: HTMLElement): HTMLElement {
  return <HTMLElement>(<unknown>{
    getElementsByClassName: (selector: string) => {
      switch (selector) {
        case 'mobile-nav':
          return [nav];
        default:
          return [header];
      }
    },
  });
}

function getSectionElements(): HTMLElement[] {
  return [<HTMLElement>(<unknown>{})];
}

function getStepElements(): HTMLElement[] {
  return [<HTMLElement>(<unknown>{})];
}

function getNavElement(
  steps: HTMLElement[],
  sections: HTMLElement[]
): HTMLElement {
  return <HTMLElement>(<unknown>{
    getElementsByClassName: (selector: string) => {
      switch (selector) {
        case 'section-item':
          return sections;
        default:
          return steps;
      }
    },
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
    },
  });
}

function getNavHeaderElement(): HTMLElement {
  return <HTMLElement>(<unknown>{});
}
