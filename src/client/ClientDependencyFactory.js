/**
 * Factory for Client dependencies
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
 *
 * XXX: This class is temporary; I understand that it is a mess. It allows
 * us to inject all the dependencies and is a slow transition between the
 * terribly tightly coupled old system to a necessary Facade yet to be
 * created.
 *
 * It's like that graphic of the evolution of a monkey into a man:
 *   functions -> poorly attempted prototypes -> better prototypes -> classes
 *
 * Note that many of these classes are not yet in liza, but they will be in
 * time.
 */

const StepUiBuilder = require('../ui/step/StepUiBuilder'),
  Ui = require('../ui/Ui'),
  UiStyler = require('../ui/UiStyler'),
  UiNotifyBar = require('../ui/UiNotifyBar'),
  UiNavBar = require('../ui/nav/UiNavBar'),
  UiDialog = require('../ui/dialog/UiDialog'),
  JqueryDialog = require('../ui/dialog/JqueryDialog'),
  BaseQuote = require('../quote/BaseQuote'),
  ClientQuote = require('./quote/ClientQuote'),
  QuoteDataBucket = require('../bucket/QuoteDataBucket'),
  StagingBucketAutoDiscard = require('../bucket/StagingBucketAutoDiscard'),
  DelayedStagingBucket = require('../bucket/DelayedStagingBucket'),
  standardValidator = require('../validate/standardBucketValidator'),
  DataValidator = require('../validate/DataValidator'),
  ValidStateMonitor = require('../validate/ValidStateMonitor'),
  Failure = require('../validate/Failure'),
  Field = require('../field/BucketField'),
  FieldClassMatcher = require('../field/FieldClassMatcher'),
  XhttpQuoteTransport = require('./transport/XhttpQuoteTransport'),
  JqueryHttpDataProxy = require('./proxy/JqueryHttpDataProxy'),
  XhttpQuoteStagingTransport = require('./transport/XhttpQuoteStagingTransport'),
  Nav = require('./nav//Nav'),
  HashNav = require('../ui/nav/HashNav'),
  ClientDataProxy = require('./ClientDataProxy'),
  ElementStyler = require('../ui/ElementStyler'),
  FormErrorBox = require('../ui/sidebar/FormErrorBox'),
  Sidebar = require('../ui/sidebar/Sidebar'),
  DataApiFactory = require('../dapi/DataApiFactory'),
  DataApiManager = require('../dapi/DataApiManager'),
  DataApiMediator = require('./dapi/DataApiMediator'),
  RootDomContext = require('../ui/context/RootDomContext'),
  DomFieldFactory = require('../ui/field/DomFieldFactory'),
  StepErrorStyler = require('../ui/styler/StepErrorStyler'),
  SidebarErrorStyler = require('../ui/styler/SidebarErrorStyler'),
  ErrorFieldStyler = require('../ui/styler/ErrorFieldStyler'),
  NaFieldStyler = require('../ui/styler/NaFieldStyler'),
  diffStore = require('../system/client').data.diffStore,
  FieldVisibilityEventHandler = require('./event/FieldVisibilityEventHandler'),
  IndvRateEventHandler = require('./event/IndvRateEventHandler'),
  RateEventHandler = require('./event/RateEventHandler'),
  StatusEventHandler = require('./event/StatusEventHandler'),
  ValueSetEventHandler = require('./event/ValueSetEventHandler'),
  Cvv2DialogEventHandler = require('./event/Cvv2DialogEventHandler');

const {
  ExpandAncestorAwareStyler,
} = require('../ui/styler/ExpandAncestorAwareStyler');
const {
  LeftAlignAncestorAwareStyler,
} = require('../ui/styler/LeftAlignAncestorAwareStyler');
const {
  WidthAncestorAwareStyler,
} = require('../ui/styler/WidthAncestorAwareStyler');

const {Cmatch} = require('../client/Cmatch');
const {CmatchVisibility} = require('../client/CmatchVisibility');
const {FieldResetter} = require('../client/FieldResetter');
const {GridCollection} = require('../ui/step/GridCollection');
const {ContextParser} = require('../ui/context/ContextParser');
const {DelegateEventHandler} = require('./event/DelegateEventHandler');
const {DelayEventHandler} = require('./event/DelayEventHandler');
const {KickbackEventHandler} = require('./event/KickbackEventHandler');
const {LockEventHandler} = require('./event/LockEventHandler');
const {NavFreezeEventHandler} = require('./event/NavFreezeEventHandler');
const {GroupContext} = require('../ui/context/GroupContext');
const {WindowFeatureFlag} = require('../system/flags/WindowFeatureFlag');
const {GeneralStepUi} = require('../ui/step/GeneralStepUi');
const {FieldContextFactory} = require('../ui/context/FieldContextFactory');
const {FieldStylerFactory} = require('../ui/context/styler/FieldStylerFactory');
const {Group} = require('../group/Group');
const {AccordionGroupUi} = require('../ui/group/AccordionGroupUi');
const {FlatGroupUi} = require('../ui/group/FlatGroupUi');
const {TableGroupUi} = require('../ui/group/TableGroupUi');
const {TabbedGroupUi} = require('../ui/group/TabbedGroupUi');
const {TabbedBlockGroupUi} = require('../ui/group/TabbedBlockGroupUi');
const {StackedGroupUi} = require('../ui/group/StackedGroupUi');
const {SideTableGroupUi} = require('../ui/group/SideTableGroupUi');
const {CollapseTableGroupUi} = require('../ui/group/CollapseTableGroupUi');
const {GridGroupUi} = require('../ui/group/GridGroupUi');
const {GroupStateManager} = require('../ui/group/GroupStateManager');
const {Step} = require('../step/Step');
const {multiSort} = require('../sort/MultiSort');
const {MobileNav} = require('../ui/nav/MobileNav');
const {NavStyler} = require('../ui/nav/NavStyler');
const {NavStylerManager} = require('../ui/nav/NavStylerManager');
const {
  createQuotePreStagingHook,
  createQuoteStagingHook,
} = require('./quote/ClientQuoteHooks');

const Class = require('easejs').Class;

module.exports = Class('ClientDependencyFactory', {
  /**
   * DOM
   * @type {Document}
   */
  _document: null,

  /**
   * Creates a new ElementStyler instance
   *
   * @return {ElementStyler}
   */
  createElementStyler: ElementStyler,

  /**
   * Creates a new data proxy used for client-server communication
   *
   * @return {ClientDataProxy}
   */
  createDataProxy: ClientDataProxy,

  createNav: Nav,

  createNavStylerManager: function (document, nav) {
    return new NavStylerManager([
      this.createNavStyler(document, nav),
      this.createMobileNavStyler(document, nav),
    ]);
  },

  createNavStyler: function (document, nav) {
    return new NavStyler(
      nav,
      document.querySelectorAll('.step-nav > li'),
      document.querySelectorAll('.section-nav > li'),
      document.querySelectorAll('.section-nav, .step-nav')
    );
  },

  createMobileNavStyler: function (document, nav) {
    return new NavStyler(
      nav,
      document.querySelectorAll(
        '.mobile-nav > li.section-item > ul > li.step-item'
      ),
      document.querySelectorAll('.mobile-nav > li.section-item'),
      document.querySelectorAll('.mobile-nav, .mobile-nav-header'),
      true
    );
  },

  createHashNav: HashNav,

  /**
   * Instantiates ClientDependencyFactory
   *
   * @param {Document} _document DOM
   */
  __construct: function (_document) {
    this._document = _document;
  },

  createDataApiManager: function () {
    return DataApiManager(DataApiFactory());
  },

  createCmatch: function (program, client) {
    const matcher = FieldClassMatcher(program.whens);
    const visibility = new CmatchVisibility(client);
    const resetter = new FieldResetter(client);
    return new Cmatch(matcher, program, client, visibility, resetter);
  },

  createProgram: function (id, dapi_manager) {
    return require('program/' + id + '/Program')(dapi_manager);
  },

  createDataBucket: QuoteDataBucket,

  createStagingBucket: function (bucket) {
    return DelayedStagingBucket(bucket);
  },

  createStagingBucketDiscard: StagingBucketAutoDiscard,

  createDataBucketTransport: function (url, proxy, concluding_save) {
    return XhttpQuoteTransport(url, proxy, concluding_save);
  },

  createStagingDataBucketTransport: function (quote_id) {
    return XhttpQuoteStagingTransport(
      quote_id + '/quicksave',
      JqueryHttpDataProxy(jQuery)
    );
  },

  createQuote: function (quote_id, data) {
    return ClientQuote(
      BaseQuote(quote_id, this.createDataBucket()),
      data,
      bucket => {
        return this.createStagingBucket(bucket);
      }
    );
  },

  createQuotePreStagingHook: createQuotePreStagingHook,

  createQuoteStagingHook: function (client, program, quote_id, proxy) {
    return createQuoteStagingHook(
      client,
      program,
      this.createDataBucketTransport(quote_id + '/autosave', proxy, false)
    );
  },

  createValidatorFormatter: function (field_map) {
    return standardValidator(field_map);
  },

  /**
   * Create validator for bucket/class changes
   *
   * @param {Object}            field_map field qtype map
   * @param {ValidStateMonitor} monitor   field error monitor
   *
   * @return {DataValidator}
   */
  createDataValidator: function (field_map, monitor) {
    return DataValidator(
      this.createValidatorFormatter(field_map),
      monitor,
      this,
      diffStore
    );
  },

  createFieldValidator: function () {
    return ValidStateMonitor();
  },

  /**
   * Create failure for given field
   *
   * @param {string}  name        field name
   * @param {number}  index       field index
   * @param {string}  reason      failure reason
   * @param {?string} cause_name  field name of cause
   * @param {?number} cause_index field index of cause
   *
   * @return {Failure}
   */
  createFieldFailure: function (name, index, reason, cause_name, cause_index) {
    return Failure(
      Field(name, index),
      reason,
      cause_name ? Field(cause_name, cause_index) : undefined
    );
  },

  createUi: Ui,

  createUiDialog: function () {
    return UiDialog(jQuery, () => {
      return JqueryDialog(jQuery);
    });
  },

  createUiNavBar: UiNavBar,
  createMobileNav: nav_menu => new MobileNav(nav_menu),

  createUiStyler: UiStyler,
  createDomFieldFactory: DomFieldFactory,
  createStepErrorStyler: function (msg_default) {
    return StepErrorStyler(msg_default, ErrorFieldStyler());
  },
  createSidebarErrorStyler: SidebarErrorStyler,
  createRootDomContext: RootDomContext,

  createStep: (id, quote) => {
    return new Step(id, quote, multiSort);
  },

  createStepUi: function (
    step,
    styler,
    formatter,
    group_builder,
    collection_builder,
    data_get,
    callback
  ) {
    const feature_flag = WindowFeatureFlag.getInstance();
    StepUiBuilder(
      styler,
      formatter,
      group_builder,
      collection_builder,
      data_get,
      feature_flag
    )
      .setStep(step)
      .build(GeneralStepUi, callback);
  },

  createGroup: () => {
    return new Group();
  },

  createGroupUi: function (
    group,
    content,
    styler,
    root_context,
    na_styler,
    qtypes,
    arefs
  ) {
    // default
    let obj = FlatGroupUi;

    if (content.classList.contains('table')) {
      obj = TableGroupUi;
    } else if (content.classList.contains('sidetable')) {
      obj = SideTableGroupUi;
    } else if (content.classList.contains('collapsetable')) {
      obj = CollapseTableGroupUi;
    } else if (content.classList.contains('tabbed')) {
      obj = TabbedGroupUi;
    } else if (content.classList.contains('tabbedblock')) {
      obj = TabbedBlockGroupUi;
    } else if (content.classList.contains('stacked')) {
      obj = StackedGroupUi;
    } else if (content.classList.contains('accordion')) {
      obj = AccordionGroupUi;
    } else if (content.classList.contains('grid')) {
      obj = GridGroupUi;
    }

    const context = this.createGroupContext(qtypes, arefs, styler);
    const feature_flag = WindowFeatureFlag.getInstance();
    const state_manager = new GroupStateManager();

    return new obj(
      group,
      content,
      styler,
      jQuery,
      context,
      root_context,
      na_styler,
      feature_flag,
      state_manager
    );
  },

  /**
   * Create a collection
   *
   * @param {HTMLElement} content - main UI element
   * @param {GroupUi}     groups  - groups in the UI
   *
   * @return {Collection} a collection of groups
   */
  createCollection: function (content, groups) {
    const collection_type = content.getAttribute('data-collection-type');
    let collection;

    switch (collection_type) {
      case 'grid':
        collection = new GridCollection(
          content,
          groups,
          [
            new WidthAncestorAwareStyler(),
            new LeftAlignAncestorAwareStyler(),
            new ExpandAncestorAwareStyler(),
          ],
          this._document
        );
    }

    return collection;
  },

  createNaFieldStyler: function () {
    return NaFieldStyler();
  },

  createGroupContext: function (qtypes, arefs, styler) {
    return new GroupContext(
      new ContextParser(),
      new FieldContextFactory(
        this._document,
        new FieldStylerFactory(qtypes, arefs, styler)
      )
    );
  },

  createFormErrorBox: FormErrorBox,

  createSidebar: Sidebar,

  createNotifyBar: UiNotifyBar,

  createClientEventHandler: function (
    client,
    data_validator,
    styler,
    data_proxy,
    jquery
  ) {
    const field_vis_handler = FieldVisibilityEventHandler(
      client.getUi(),
      data_validator
    );

    return new DelegateEventHandler({
      indvRate: IndvRateEventHandler(client, data_proxy),
      rate: RateEventHandler(client, data_proxy),
      kickBack: new KickbackEventHandler(client),
      status: StatusEventHandler(styler),
      set: ValueSetEventHandler(client),
      action$cvv2Dialog: Cvv2DialogEventHandler(jquery),
      delay: new DelayEventHandler(client),
      show: field_vis_handler,
      hide: field_vis_handler,
      lock: new LockEventHandler(client),
      navFreeze: new NavFreezeEventHandler(client),
    });
  },

  createDataApiMediator: DataApiMediator,
});
