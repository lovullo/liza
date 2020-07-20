/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", no-unused-vars: "off", no-undef: "off", node/no-missing-require: "off", prefer-arrow-callback: "off" */
/**
 * Factory for Client dependencies
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

var Step = require('../step/Step'),
  StepUiBuilder = require('../ui/step/StepUiBuilder'),
  Group = require('../group/Group'),
  GroupUi = require('../ui/group/GroupUi'),
  AccordionGroupUi = require('../ui/group/AccordionGroupUi'),
  FlatGroupUi = require('../ui/group/FlatGroupUi'),
  TableGroupUi = require('../ui/group/TableGroupUi'),
  TabbedGroupUi = require('../ui/group/TabbedGroupUi'),
  TabbedBlockGroupUi = require('../ui/group/TabbedBlockGroupUi'),
  StackedGroupUi = require('../ui/group/StackedGroupUi'),
  SideTableGroupUi = require('../ui/group/SideTableGroupUi'),
  CollapseTableGroupUi = require('../ui/group/CollapseTableGroupUi'),
  GridGroupUi = require('../ui/group/GridGroupUi'),
  GroupStateManager = require('../ui/group/GroupStateManager')
    .GroupStateManager,
  Ui = require('../ui/Ui'),
  UiStyler = require('../ui/UiStyler'),
  UiNotifyBar = require('../ui/UiNotifyBar'),
  UiNavBar = require('../ui/nav/UiNavBar'),
  UiDialog = require('../ui/dialog/UiDialog'),
  JqueryDialog = require('../ui/dialog/JqueryDialog'),
  BaseQuote = require('../quote/BaseQuote'),
  ClientQuote = require('./quote/ClientQuote'),
  QuoteDataBucket = require('../bucket/QuoteDataBucket'),
  StagingBucket = require('../bucket/StagingBucket'),
  StagingBucketAutoDiscard = require('../bucket/StagingBucketAutoDiscard'),
  DelayedStagingBucket = require('../bucket/DelayedStagingBucket'),
  standardValidator = require('../validate/standardBucketValidator'),
  DataValidator = require('../validate/DataValidator'),
  ValidStateMonitor = require('../validate/ValidStateMonitor'),
  Failure = require('../validate/Failure'),
  Field = require('../field/BucketField'),
  XhttpQuoteTransport = require('./transport/XhttpQuoteTransport'),
  JqueryHttpDataProxy = require('./proxy/JqueryHttpDataProxy'),
  XhttpQuoteStagingTransport = require('./transport/XhttpQuoteStagingTransport'),
  Nav = require('./nav//Nav'),
  HashNav = require('../ui/nav/HashNav'),
  ClientDataProxy = require('./ClientDataProxy'),
  ElementStyler = require('../ui/ElementStyler'),
  FormErrorBox = require('../ui/sidebar/FormErrorBox'),
  NavStyler = require('../ui/nav/NavStyler'),
  Sidebar = require('../ui/sidebar/Sidebar'),
  DataApiFactory = require('../dapi/DataApiFactory'),
  DataApiManager = require('../dapi/DataApiManager'),
  DataApiMediator = require('./dapi/DataApiMediator');

(RootDomContext = require('../ui/context/RootDomContext')),
  (DomFieldFactory = require('../ui/field/DomFieldFactory')),
  (StepErrorStyler = require('../ui/styler/StepErrorStyler')),
  (SidebarErrorStyler = require('../ui/styler/SidebarErrorStyler')),
  (ErrorFieldStyler = require('../ui/styler/ErrorFieldStyler')),
  (NaFieldStyler = require('../ui/styler/NaFieldStyler')),
  (diffStore = require('liza/system/client').data.diffStore),
  (FieldVisibilityEventHandler = require('./event/FieldVisibilityEventHandler')),
  (IndvRateEventHandler = require('./event/IndvRateEventHandler')),
  (RateEventHandler = require('./event/RateEventHandler')),
  (StatusEventHandler = require('./event/StatusEventHandler')),
  (ValueSetEventHandler = require('./event/ValueSetEventHandler')),
  (Cvv2DialogEventHandler = require('./event/Cvv2DialogEventHandler'));

const {
  ExpandAncestorAwareStyler,
} = require('../ui/styler/ExpandAncestorAwareStyler');
const {
  LeftAlignAncestorAwareStyler,
} = require('../ui/styler/LeftAlignAncestorAwareStyler');
const {
  WidthAncestorAwareStyler,
} = require('../ui/styler/WidthAncestorAwareStyler');
const {GridCollection} = require('../ui/step/GridCollection');
const {ContextParser} = require('../ui/context/ContextParser');
const {DelegateEventHandler} = require('./event/DelegateEventHandler');
const {DelayEventHandler} = require('./event/DelayEventHandler');
const {KickbackEventHandler} = require('./event/KickbackEventHandler');
const {GroupContext} = require('../ui/context/GroupContext');
const {WindowFeatureFlag} = require('../system/flags/WindowFeatureFlag');
const {GeneralStepUi} = require('../ui/step/GeneralStepUi');
const {FieldContextFactory} = require('../ui/context/FieldContextFactory');
const {FieldStylerFactory} = require('../ui/context/styler/FieldStylerFactory');
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

  createNavStyler: NavStyler,

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
    var _self = this;

    return ClientQuote(
      BaseQuote(quote_id, this.createDataBucket()),
      data,
      function (bucket) {
        return _self.createStagingBucket(bucket);
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

  createFieldValidator: function (field_map) {
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
    return UiDialog(jQuery, function () {
      return JqueryDialog(jQuery);
    });
  },

  createUiNavBar: UiNavBar,

  createUiStyler: UiStyler,
  createDomFieldFactory: DomFieldFactory,
  createStepErrorStyler: function (msg_default) {
    return StepErrorStyler(msg_default, ErrorFieldStyler());
  },
  createSidebarErrorStyler: SidebarErrorStyler,
  createRootDomContext: RootDomContext,

  createStep: Step,

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

  createGroup: Group,

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
    var obj = FlatGroupUi;

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

    return obj(
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
    var collection;

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
    });
  },

  createDataApiMediator: DataApiMediator,
});
