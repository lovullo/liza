/**
 * Factory for Client dependencies
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
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

var Step          = require( '../step/Step' ),
    GeneralStepUi = require( '../ui/step/GeneralStepUi' ),
    StepUiBuilder = require( '../ui/step/StepUiBuilder' ),

    Group                = require( '../group/Group' ),
    GroupUi              = require( '../ui/group/GroupUi' ),
    FlatGroupUi          = require( '../ui/group/FlatGroupUi' ),
    TableGroupUi         = require( '../ui/group/TableGroupUi' ),
    TabbedGroupUi        = require( '../ui/group/TabbedGroupUi' ),
    TabbedBlockGroupUi   = require( '../ui/group/TabbedBlockGroupUi' ),
    SideTableGroupUi     = require( '../ui/group/SideTableGroupUi' ),
    CollapseTableGroupUi = require( '../ui/group/CollapseTableGroupUi' ),

    // TODO: delete me
    AccordionGroupUi = require( 'program/ui/AccordionGroupUi' ),

    Ui           = require( 'program/ui/Ui' ),
    UiStyler     = require( 'program/ui/UiStyler' ),
    UiNotifyBar  = require( 'program/ui/UiNotifyBar' ),
    UiNavBar     = require( 'program/ui/UiNavBar' ),
    UiDialog     = require( 'program/ui/dialog/UiDialog' ),
    JqueryDialog = require( 'program/ui/dialog/JqueryDialog' ),

    BaseQuote                = require( 'program/quote/BaseQuote' ),
    QuoteClient              = require( 'program/QuoteClient' ),
    QuoteDataBucket          = require( '../bucket/QuoteDataBucket' ),
    StagingBucket            = require( '../bucket/StagingBucket' ),
    StagingBucketAutoDiscard = require( '../bucket/StagingBucketAutoDiscard' ),
    DelayedStagingBucket     = require( '../bucket/DelayedStagingBucket' ),

    DataValidator     = require( '../validate/DataValidator' ),
    ValidStateMonitor = require( '../validate/ValidStateMonitor' ),
    standardValidator = require( 'program/standardBucketValidator' ),
    Failure           = require( '../validate/Failure' ),
    Field             = require( '../field/BucketField' ),

    XhttpQuoteTransport = require( 'program/transport/XhttpQuoteTransport' ),
    JqueryHttpDataProxy = require( 'program/proxy/JqueryHttpDataProxy' ),

    XhttpQuoteStagingTransport =
        require( 'program/transport/XhttpQuoteStagingTransport' ),

    Nav     = require( 'program/Nav' ),
    HashNav = require( 'program/ui/HashNav' ),

    ClientDataProxy = require( 'program/ClientDataProxy' ),
    ElementStyler   = require( '../ui/ElementStyler' ),
    FormErrorBox    = require( 'program/ui/FormErrorBox' ),
    NavStyler       = require( 'program/ui/NavStyler' ),
    Sidebar         = require( 'program/ui/Sidebar' ),

    FieldClassMatcher = require( 'program/FieldClassMatcher' ),
    DataApiFactory    = require( 'program/api/DataApiFactory' ),
    DataApiManager    = require( '../dapi/DataApiManager' ),

    RatingWorksheet = require( 'program/ui/RatingWorksheet' ),

    RootDomContext     = require( '../ui/context/RootDomContext' ),
    DomFieldFactory    = require( '../ui/field/DomFieldFactory' ),
    StepErrorStyler    = require( '../ui/styler/StepErrorStyler' ),
    SidebarErrorStyler = require( '../ui/styler/SidebarErrorStyler' ),
    ErrorFieldStyler   = require( '../ui/styler/ErrorFieldStyler' ),

    NaFieldStyler          = require( '../ui/styler/NaFieldStyler' ),
    NaFieldStylerAnimation = require( '../ui/styler/NaFieldStylerAnimation' ),

    DelegateEventHandler = require( '../event/DelegateEventHandler' ),

    diffStore = require( 'liza/system/client' ).data.diffStore,

    Class = require( 'easejs' ).Class;


var liza_event = require( '../event' );


function requireh( name )
{
    return liza_event[ name ];
}


module.exports = Class( 'ClientDependencyFactory',
{
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


    createDataApiManager: function()
    {
        return DataApiManager( DataApiFactory() );
    },


    createProgram: function( id, dapi_manager )
    {
        return require( 'program/' + id + '/Program' )(
           dapi_manager
        );
    },


    createDataBucket: QuoteDataBucket,


    createStagingBucket: function( bucket )
    {
        return DelayedStagingBucket( bucket );
    },


    createStagingBucketDiscard: StagingBucketAutoDiscard,


    createDataBucketTransport: function ( quote_id, step_id, proxy )
    {
        return XhttpQuoteTransport(
            ( quote_id + '/step/' + step_id + '/post' ),
            proxy
        );
    },


    createStagingDataBucketTransport: function( quote_id )
    {
        return XhttpQuoteStagingTransport(
            ( quote_id + '/quicksave' ),
            JqueryHttpDataProxy( jQuery )
        );
    },


    createQuote: function ( quote_id, data )
    {
        var _self = this;

        return QuoteClient(
            BaseQuote( quote_id, this.createDataBucket() ),
            data,
            function( bucket )
            {
                return _self.createStagingBucket( bucket );
            }
        );
    },


    createValidatorFormatter: function( field_map )
    {
        return standardValidator( field_map );
    },


    /**
     * Create validator for bucket/class changes
     *
     * @param {Object}            field_map field qtype map
     * @param {ValidStateMonitor} monitor   field error monitor
     *
     * @return {DataValidator}
     */
    createDataValidator: function( field_map, monitor )
    {
        return DataValidator(
            this.createValidatorFormatter( field_map ),
            monitor,
            this,
            diffStore
        );
    },


    createFieldValidator: function( field_map )
    {
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
    createFieldFailure: function( name, index, reason, cause_name, cause_index )
    {
        return Failure(
            Field( name, index ),
            reason,
            ( cause_name )
                ? Field( cause_name, cause_index )
                : undefined
        );
    },


    createUi: Ui,


    createUiDialog: function()
    {
        return UiDialog( jQuery, function()
        {
            return JqueryDialog( jQuery );
        } );
    },


    createUiNavBar: UiNavBar,


    createUiStyler: UiStyler,
    createDomFieldFactory: DomFieldFactory,
    createStepErrorStyler: function( msg_default )
    {
        return StepErrorStyler( msg_default, ErrorFieldStyler() );
    },
    createSidebarErrorStyler: SidebarErrorStyler,
    createRootDomContext: RootDomContext,


    createStep: Step,


    createStepUi: function(
        step, styler, formatter, group_builder, data_get, callback
    )
    {
        StepUiBuilder( styler, formatter, group_builder, data_get )
            .setStep( step )
            .build( GeneralStepUi, callback );
    },


    createGroup: Group,


    createGroupUi: function (
        group, $content, styler, root_context, na_styler
    )
    {
        // default
        var obj = FlatGroupUi;

        if ( $content.hasClass( 'table' ) )
        {
            obj = TableGroupUi;
        }
        else if ( $content.hasClass( 'sidetable' ) )
        {
            obj = SideTableGroupUi;
        }
        else if ( $content.hasClass( 'collapsetable' ) )
        {
            obj = CollapseTableGroupUi;
        }
        else if ( $content.hasClass( 'tabbed' ) )
        {
            obj = TabbedGroupUi;
        }
        else if ( $content.hasClass( 'tabbedblock' ) )
        {
            obj = TabbedBlockGroupUi;
        }
        else if ( $content.hasClass( 'accordion' ) )
        {
            obj = AccordionGroupUi;
        }

        return obj(
            group, $content, styler, jQuery, root_context, na_styler
        );
    },


    createNaFieldStyler: function()
    {
        return NaFieldStyler
            .use( NaFieldStylerAnimation( jQuery ) )();
    },

    createFormErrorBox: FormErrorBox,


    createSidebar: Sidebar,

    createNotifyBar: UiNotifyBar,

    createFieldClassMatcher: FieldClassMatcher,


    createClientEventHandler: function(
        client, data_validator, styler, data_proxy, jquery
    )
    {
        const field_vis_handler = requireh( 'FieldVisibilityEventHandler' )(
            client.getUi(),
            data_validator
        );

        return DelegateEventHandler( {
            'indvRate': requireh( 'IndvRateEventHandler' )(
                client, data_proxy
            ),

            'rate':     requireh( 'RateEventHandler' )( client, data_proxy ),
            'kickBack': requireh( 'KickbackEventHandler' )( client ),
            'status':   requireh( 'StatusEventHandler' )( styler ),

            'show': field_vis_handler,
            'hide': field_vis_handler,

            'action$cvv2Dialog':   requireh( 'Cvv2DialogEventHandler' )( jquery )
        } );
    }
});
