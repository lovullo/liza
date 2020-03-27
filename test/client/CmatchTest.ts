/**
 * Test case for Cmatch
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
 */

import {Cmatch as Sut, CmatchData, VisibilityQueue} from "../../src/client/Cmatch";

// const { event }  = require( '../../' ).client;
import { expect } from 'chai';

import { ClientQuote, Data } from "../../src/client/quote/ClientQuote";
import { StagingBucket } from "../../src/bucket/StagingBucket";
import { DataDiff, DataValidator, ValidationFailure } from "../../src/validate/DataValidator";
import { FieldClassMatcher } from "../../src/field/FieldClassMatcher";
import { ClassificationResult, Program } from "../../src/program/Program";
import { DataApiResult } from "../../src/dapi/DataApi";
import { Client } from "../../src/client/Client";
import { Nav } from "../../src/client/nav/Nav";
import { ElementStyler } from "../../src/ui/ElementStyler";
import { Ui } from "../../src/ui/Ui";
import { StepUi } from "../../src/ui/step/StepUi";
import { ExclusiveFields, Step } from "../../src/step/Step";
import { GroupUi } from "../../src/ui/group/GroupUi";
import {PositiveInteger} from "../../src/numeric";

// these tests aren't terribly effective right now
describe( "Cmatch", () =>
{
    it( "marks hidden fields on class change to show", () =>
    {
        const {
            sut,
        } = createStubs();

        expect(
            sut.markShowHide( 'foo', {}, [ <PositiveInteger>1, <PositiveInteger>2 ], [] )
        ).to.deep.equal( { foo: { show: [ 1, 2 ] } } );
    } );


    it( "marks shown fields on class change to hide", () =>
    {
        const {
            sut,
        } = createStubs();

        expect(
            sut.markShowHide(
                'foo',
                {},
                [],
                [ <PositiveInteger>3, <PositiveInteger>4, <PositiveInteger>5 ]
            )
        ).to.deep.equal( { foo: { hide: [ 3, 4, 5 ] } } );
    } );


    it( "marks combination show/hide on class change", () =>
    {

        const {
            sut,
        } = createStubs();

        expect(
            sut.markShowHide(
                'foo',
                {},
                [ <PositiveInteger>2, <PositiveInteger>3 ],
                [ <PositiveInteger>4, <PositiveInteger>5, <PositiveInteger>6 ] )
        ).to.deep.equal( {
            foo: {
                show: [ 2, 3 ],
                hide: [ 4, 5, 6 ],
            }
        } );
    } );


    it( "marks no fields with no show or hide", () =>
    {
        const {
            sut,
        } = createStubs();

        expect(
            sut.markShowHide( 'foo', {}, [], [] )
        ).to.deep.equal( {} );
    } );


    it( "handleClassMatch throws error if step is undefined", () =>
    {
        const {
            sut,
        } = createStubs();

        expect( () => sut.handleClassMatch( {}, false ) ).to.throw( TypeError );
    } );


    it( "does not affect marking of other fields", () =>
    {
        const barval = {};
        const visq   = { bar: barval };

        const {
            sut,
        } = createStubs();

        const results: VisibilityQueue = sut.markShowHide(
            'foo',
            visq,
            [ <PositiveInteger>1 ],
            [ <PositiveInteger>0 ]
        );

        expect( results.bar ).to.equal( barval );
    } );


    it( "handleClassMatch triggers dapi for every visible queued element",
        done =>
    {
        const field_names = {
            foo: true,
            bar: true,
            baz: true,
        };

        const cmatch: CmatchData = {
            foo: { all: true, any: true, indexes: [ 0 ] },
            baz: { all: true, any: true, indexes: [ 0 ] },
        };

        const step_ui = createStubStepUi( field_names );

        const {
            data_validator,
            quote,
            program,
            sut,
        } = createStubs( cmatch, step_ui );

        let given: string[] = [];
        let async_flag= false;
        let dapi_call_count = 0;

        program.dapi = (
            _step_id: PositiveInteger,
            field: string,
            _bucket: StagingBucket,
            _diff: Record<string, any>,
            _cmatch: CmatchData,
            _callback: ( () => void ) | null
        ) =>
        {
            given.push( field );
            ++dapi_call_count;

            if ( dapi_call_count === 2 && async_flag )
            {
                expect( given ).to.deep
                    .equal( [ 'foo', 'baz' ] );
                done();
            }

            return <DataApiResult>{};
        }

        sut.hookClassifier( data_validator );
        quote.emit("classify");
        async_flag = true;
    } );


    it( "getCmatchFields returns only fields with cmatch data", () =>
    {
        const expected_fields = [
            'foo_address',
            'foo_phone'
        ];

        const field_names = [
            'foo_name',
            'foo_id',
            'foo_address',
            'foo_term',
            'foo_date',
            'foo_phone',
            'foo_email',
        ];

        const cmatch: CmatchData = {
            foo_address: { all: true, any: true, indexes: [ 0 ] },
            foo_phone:   { all: true, any: true, indexes: [ 0 ] }
        };

        const {
            sut,
            quote,
            data_validator
        } = createStubs( cmatch );

        sut.hookClassifier( data_validator );
        quote.emit( "classify" );

        expect( sut.getCmatchFields( field_names ) )
            .to.deep.equal( expected_fields );
    } );


    /**
     * __classes is always returned (at least at the time of writing) by
     * TAME.  here was a bug when it was recognized as a field (e.g. marked
     * as an `external' in program.xml),
     */
    it( "does not fail when __classes is a known field", () =>
    {
        const cmatch = {
            // populated by TAME, always
            __classes: {},
        };

        const field_names = {
            '__classes': true,
        };

        const step_ui = createStubStepUi( field_names );
        const {
            sut,
            quote,
            data_validator
        } = createStubs( cmatch, step_ui );

        sut.hookClassifier( data_validator );
        quote.emit( "classify" );
    } );
} );


function createStubClientQuote()
{
    const callbacks: any = {};

    return new class implements ClientQuote
    {
        setClassifier( _known_fields: any, _classifier: any ): ClientQuote
        {
            return this;
        }

        getDataByName( _name: string ): Record<string, any>
        {
            return {};
        }

        visitData(
            visitor: ( bucket: StagingBucket ) => void
        ): void
        {
            visitor( <StagingBucket>{} );
        }

        setData( _data: Data ): ClientQuote
        {
            return this;
        }

        on( name: string, callback: any ): void
        {
            callbacks[ name ] = callback;
        }

        emit( name: string )
        {
            const data = Array.prototype.slice.call( arguments, 1 );

            callbacks[ name ].apply( null, data );
        }
    };
}


function createStubDataValidator()
{
    return new class implements DataValidator
    {
        validate(
            _diff: DataDiff | undefined,
            _classes: any,
            _validatef?: ( diff: DataDiff, failures: ValidationFailure ) => void
        ): Promise<any>
        {
            return new Promise<any>( () => {} );
        }
    };
}


function createStubClassMatcher( cmatch: CmatchData )
{
    return new class implements FieldClassMatcher
    {
        match(
            _classes: any,
            callback: ( cmatch: any ) => void
        ): FieldClassMatcher
        {
            callback( cmatch );
            return this;
        }
    }
}


function createStubProgram()
{
    return <Program>{
        getId:               () => '1',
        ineligibleLockCount: 0,
        cretain:             {},
        apis:                {},
        internal:            {},
        meta:                {
            arefs:  {},
            fields: {},
            groups: {},
            qdata:  {},
            qtypes: {},
        },
        mapis:                    {},
        rateSteps:                [],
        dapi:                     () => <DataApiResult>{},
        initQuote:                () => {},
        getClassifierKnownFields: () => <ClassificationResult>{},
        classify:                 () => <ClassificationResult>{},
    };
}


function createStubUi( step: StepUi | null )
{
    return <Ui>{
        setCmatch: () => {},
        getCurrentStep: () => step
    }
}


function createStubStepUi( field_names: ExclusiveFields  )
{
    const step = <Step>{
        getExclusiveFieldNames: () => field_names
    };

    return <StepUi>{
        getElementGroup: () => <GroupUi>{},
        getStep: () => <Step>step
    }
}


function createStubClient( quote: ClientQuote, ui: Ui )
{
    return <Client>{
        nav: <Nav>{
            getCurrentStepId: () => <PositiveInteger>0
        },
        elementStyler: <ElementStyler>{},
        getUi: () => <Ui>ui,
        getQuote: () => <ClientQuote>quote,
        handleError: ( _e: Error) => {},
        handleEvent: () => <Client>{},
    };
}


function createStubs(
    cmatch: CmatchData = {},
    step: StepUi | null = null
)
{
    const data_validator = createStubDataValidator();
    const quote          = createStubClientQuote();
    const program        = createStubProgram();
    const class_matcher  = createStubClassMatcher( cmatch );
    const ui             = createStubUi( step );
    const client         = createStubClient( quote, ui );

    const sut =  new class extends Sut
    {
        public markShowHide(
            field: string,
            visq: VisibilityQueue,
            show: PositiveInteger[],
            hide: PositiveInteger[]
        ): VisibilityQueue
        {
            return super.markShowHide( field, visq, show, hide );
        }

        public handleClassMatch(
            cmatch: CmatchData,
            force?: boolean
        ): void
        {
            super.handleClassMatch( cmatch, force );
        }
    }( class_matcher, program, client );

    return {
        sut: sut,
        data_validator: data_validator,
        quote: quote,
        ui: ui,
        client: client,
        program: program,
        class_matcher: class_matcher
    };
}