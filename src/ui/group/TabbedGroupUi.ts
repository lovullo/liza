/* TODO auto-generated eslint ignore, please fix! */
/* eslint @typescript-eslint/no-inferrable-types: "off", @typescript-eslint/no-this-alias: "off", no-var: "off", eqeqeq: "off", no-unused-vars: "off", no-undef: "off", prefer-arrow-callback: "off" */
/**
 * Group tabbed UI
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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
 *
 * @needsLove
 *   - Remove reliance on jQuery.
 *   - Dependencies need to be liberated: Styler; Group.
 * @end needsLove
 */

import {GroupUi} from './GroupUi';
import {ClientQuote} from '../../client/quote/ClientQuote';
import {PositiveInteger} from '../../numeric';

declare type jQuery = any;

/**
 * Represents a tabbed group
 *
 * This class extends from the generic Group class.  It contains logic to
 * support tabbed groups, allowing for the adding and removal of tabs.
 */
export class TabbedGroupUi extends GroupUi {
  /**
   * Stores the base title for each new tab
   */
  $baseTabTitle: string = '';

  /**
   * Stores the base tab content to be duplicated for tabbed groups
   */
  $baseTabContent: jQuery = null;

  /**
   * Index of the currently selected tab
   */
  private _selectedIndex: number = 0;

  /**
   * Template method used to process the group content to prepare it for
   * display
   */
  protected processContent(quote: ClientQuote): void {
    // determine if we should lock this group down
    if (this.$content.find('div.groupTabs').hasClass('locked')) {
      this.group.locked(true);
    }

    this._processTabs();
    this._attachAddTabHandlers();
    this.watchFirstElement(this.$baseTabContent, quote);
  }

  /**
   * Initializes the tabs
   *
   * This method will locate the area of HTML that should be tabbed and
   * initialize it. The content of the first tab will be removed and stored in
   * memory for duplication.
   */
  public _processTabs(): void {
    var group = this;
    var $container = this._getTabContainer();

    if ($container.length == 0) {
      return;
    }

    // grab the title to be used for all the tabs
    this.$baseTabTitle = $container.find('li:first').remove().find('a').text();

    // the base content to be used for each of the tabs (detach() not
    // remove() to ensure the data remains)
    this.$baseTabContent = $container.find('div:first');

    this.$baseTabContent.detach();

    // transform into tabbed div
    $container.tabs({
      tabTemplate:
        '<li><a href="#{href}">#{label}</a>' +
        (this.group.locked() === false
          ? '<span class="ui-icon ui-icon-close">Remove Tab</span>'
          : '') +
        '</li>',

      select: function (_: any, event: any) {
        group._selectedIndex = event.index;
      },

      add: function () {
        var $this: any = $(this);

        // if this is our max, hide the button
        if ($this.tabs('length') == group.group.maxRows()) {
          group._getAddButton().hide();
        }

        // select the new tab
        $this.tabs('select', $this.tabs('length') - 1);

        // remove tabs when the remove button is clicked (for whatever
        // reason, live() stopped working, so here we are...)
        $container.find('span.ui-icon-close:last').click(function (e: any) {
          var index = $container.find('li').index($(e.target).parent());

          group.destroyIndex(index);
        });
      },

      remove: function () {
        var $this: any = $(this);

        // should we re-show the add button?
        if ($this.tabs('length') == group.group.maxRows() - 1) {
          group._getAddButton().show();
        }
      },
    });
  }

  /**
   * Attaches click event handlers to add tab elements
   */
  public _attachAddTabHandlers(): void {
    // reference to ourself for use in the closure
    var group = this;

    // if we're locked, we won't allow additions
    if (this.group.locked()) {
      this._getAddButton().remove();
      return;
    }

    // any time an .addrow element is clicked, we want to add a row to the
    // group
    this._getAddButton().click(function () {
      group.initIndex();
    });
  }

  /**
   * Returns the element containing the tabs
   *
   * @return jQuery element containing the tabs
   */
  public _getTabContainer(): jQuery {
    return this.$content.find('.groupTabs');
  }

  _getAddButton(): jQuery {
    return this.$content.find('.addTab:first');
  }

  private _getTabTitleIndex(): number {
    return this.getCurrentIndexCount();
  }

  /**
   * Adds a tab
   */
  public addTab(): this {
    var $container = this._getTabContainer();

    var $content = this.$baseTabContent.clone(true);
    var content = $content[0];
    var id = $content.attr('id');
    var index = this.getCurrentIndex();

    // generate a new id
    id = id + '_' + index;
    $content.attr('id', id);

    // properly name the elements to prevent id conflicts
    this.setElementIdIndexes(content.getElementsByTagName('*'), index);

    // Set field content parent for this index
    this.fieldContentParent[index] = content.querySelector('dl');

    if (this.getDomPerfFlag() === true) {
      this.context.addIndex(
        <PositiveInteger>index,
        this.fieldContentParent[index]
      );
    }

    // append the content
    $container.append($content);

    // create the new tab
    var title = this.$baseTabTitle + ' ' + this._getTabTitleIndex();
    $container.tabs('add', '#' + id, title);

    // finally, style our new elements
    this.styler.apply($content);

    // raise event
    this.postAddRow($content, index);

    return this;
  }

  /**
   * Removes a tab
   */
  public removeTab(): this {
    // we can simply remove the last tab since the bucket will re-order
    // itself and update each of the previous tabs
    var index = this.getCurrentIndex();

    var $container = this._getTabContainer(),
      $panel = this._getTabContent(index);

    // remove the tab
    this.styler.remove($panel);
    $container.tabs('remove', index);

    return this;
  }

  private _getTabContent(index: number): jQuery {
    return this._getTabContainer().find('div.ui-tabs-panel:nth(' + index + ')');
  }

  protected postPreEmptyBucketFirst(): this {
    // select the first tab
    this._getTabContainer().tabs('select', 0);
    return this;
  }

  protected addIndex(index: number): this {
    // increment id before doing our own stuff
    super.addIndex(index);
    this.addTab();

    return this;
  }

  public removeIndex(index: number): this {
    // decrement after we do our own stuff
    this.removeTab();
    super.removeIndex(index);

    return this;
  }

  /**
   * Display the requested field
   *
   * The field is not given focus; it is simply brought to the foreground.
   *
   * @param field_name - name of field to display
   * @param i          - index of field
   */
  public displayField(field: string, i: number): this {
    var $element = this.styler.getWidgetByName(field, i);

    // if we were unable to locate it, then don't worry about it
    if ($element.length == 0) {
      return this;
    }

    // get the index of the tab that this element is on
    var id = $element.parents('div.ui-tabs-panel').attr('id');
    var index = id.substring(id.lastIndexOf('_'));

    // select that tab
    this._getTabContainer().tabs('select', index);

    return this;
  }

  /**
   * Shows/hides add/remove row buttons
   *
   * @param value - whether to hide (default: true)
   */
  public hideAddRemove(value: boolean): void {
    if (value === true) {
      this._getTabContainer().find('.ui-icon-close').hide();
      this._getAddButton().hide();
    } else {
      this._getTabContainer().find('.ui-icon-close').show();
      this._getAddButton().show();
    }
  }

  public isOnVisibleTab(_field: string, index: number): boolean {
    // fast check
    return +index === this._selectedIndex;
  }

  protected doHideField(field: string, index: number, force?: boolean): void {
    var _self = this;

    // if we're not on the active tab, then we can defer this request until
    // we're not busy
    if (!force && !this.isOnVisibleTab(field, index)) {
      setTimeout(function () {
        _self.doHideField(field, index, true);
      }, 25);

      return;
    }

    super.doHideField(field, index);
  }

  protected doShowField(field: string, index: number, force?: boolean): void {
    var _self = this;

    // if we're not on the active tab, then we can defer this request until
    // we're not busy
    if (!force && !this.isOnVisibleTab(field, index)) {
      setTimeout(function () {
        _self.doShowField(field, index, true);
      }, 25);

      return;
    }

    super.doShowField(field, index);
  }

  public getContentByIndex(_name: string, index: number): jQuery {
    // get the tab that this index should be on and set a property to notify
    // the caller that no index check should be performed (since there is
    // only one)
    var $content = this._getTabContent(index);
    $content.singleIndex = true;

    return $content;
  }
}
