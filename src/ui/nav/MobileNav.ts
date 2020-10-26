/**
 * MobileNav class
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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

import {EventEmitter} from 'events';

/**
 * Hooks mobile navigation bar
 */
export class MobileNav extends EventEmitter {
  readonly SECTION_CLASS = 'section-item';

  readonly STEP_CLASS = 'step-item';

  readonly NAV_CLASS = 'mobile-nav';

  readonly HEADER_CLASS = 'mobile-nav-header';

  private _nav?: HTMLElement;

  private _nav_header?: HTMLElement;

  constructor(nav_menu: HTMLElement) {
    super();

    // We don't have a nav menu, don't proceed
    if (!nav_menu) {
      return;
    }

    this._nav = <HTMLElement | undefined>(
      nav_menu.getElementsByClassName(this.NAV_CLASS)[0]
    );

    this._nav_header = <HTMLElement | undefined>(
      nav_menu.getElementsByClassName(this.HEADER_CLASS)[0]
    );

    this._init();
  }

  /**
   * Initialize onclick events and element
   */
  private _init(): void {
    if (!this._nav_header || !this._nav) {
      return;
    }

    this._nav_header.onclick = () => this.toggleNav();

    const sections = this._nav.getElementsByClassName(this.SECTION_CLASS);

    Array.prototype.forEach.call(sections, (elem, i) => {
      elem.onclick = () => {
        Array.prototype.forEach.call(sections, (section, j) => {
          const show = i === j && !section.classList.contains('show-children');

          section.classList[show ? 'add' : 'remove']('show-children');
        });
      };
    });

    const step_items = this._nav.getElementsByClassName(this.STEP_CLASS);

    Array.prototype.forEach.call(step_items, (elem, index) => {
      elem.onclick = (event: MouseEvent) => {
        event.preventDefault();
        this.emit('click', index + 1);
      };
    });
  }

  /**
   * Notify the nav of a step change
   *
   * @param header_label - a label to set on the
   */
  stepChanged(header_label: string): this {
    this._updateHeader(header_label);
    this.toggleNav(false);

    return this;
  }

  /**
   * Toggles the visibility of the nav
   *
   * @param visible - (optional) if supplied, set the visibility explicitly
   */
  public toggleNav(visible?: boolean): this {
    if (visible !== undefined) {
      this._nav?.classList[visible ? 'remove' : 'add']('hidden');
      return this;
    }

    this._nav?.classList.toggle('hidden');

    return this;
  }

  /**
   * Update the header text
   *
   * @param label - new text
   */
  private _updateHeader(label: string): this {
    if (!this._nav_header) {
      return this;
    }

    this._nav_header.innerHTML = '<span>' + label + '</span>';
    return this;
  }
}
