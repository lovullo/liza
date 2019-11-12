/**
 * Token state management test
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
 */

import { MongoDeltaDao as Sut } from "../../../src/server/db/MongoDeltaDao";
import { MongoCollection } from "mongodb";
import { PositiveInteger } from "../../../src/numeric";
import { DocumentId } from "../../../src/document/Document";

import { expect, use as chai_use } from 'chai';
chai_use( require( 'chai-as-promised' ) );


describe( 'server.db.MongoDeltaDao', () =>
{
    describe( '#getUnprocessedDocuments', () =>
    {
        it( 'gets documents', () =>
        {
            let returned_data   = { foo: 'bar' };
            let callback_called = false;

            const collection  = _createMockMongoCollection();
            collection.find   = ( _: any, __: any, c: any ) =>
            {
                c( null, {
                    toArray: ( c: any ) => c( null, returned_data ),
                } );
            };

            const callback = ( data: Record<string, any> | null ) =>
            {
                expect( returned_data ).to.deep.equal( data );

                callback_called = true;

                return;
            };

            new Sut( collection ).getUnprocessedDocuments( callback );

            expect( callback_called ).to.equal( true );
        });
    });

    describe( '#advanceDeltaIndexByType', () =>
    {
        it( 'advances specified index', () =>
        {
            const quote_id       = <DocumentId>123,
                  delta_type     = 'ratedata',
                  expected_field = 'lastPublishDelta.ratedata',
                  index          = <PositiveInteger>1;

            let callback_called = false;

            const collection  = _createMockMongoCollection();
            collection.update = (
                given_quote_id:   any,
                given_delta_type: any,
                _given_index:     any,
                given_callback:   any
            ) =>
            {
                const expected_set: Record<string, any> = {};

                expected_set[ expected_field ] = index

                expect( given_quote_id ).to.deep.equal( { id: quote_id } );
                expect( given_delta_type )
                    .to.deep.equal( { $set: expected_set } );

                given_callback( null );
            };

            const callback = ( _err: NullableError, _indexAdvanced: boolean ) =>
            {
                callback_called = true;

                return;
            };

            new Sut( collection ).advanceDeltaIndexByType(
                quote_id,
                delta_type,
                index,
                callback,
            );

            expect( callback_called ).to.equal( true );
        });
    });

    describe( '#markDocumentAsProcessed', () =>
    {
        it( 'doc marked if provided timestamp <= doc timestamp', () =>
        {
            const quote_id       = <DocumentId>123,
                  last_update_ts = <UnixTimestamp>1573582767;

            let callback_called = false;

            const collection  = _createMockMongoCollection();
            collection.update = (
                given_filter:   any,
                _:              any,
                __:             any,
                given_callback: any
            ) =>
            {
                const expected_filter: Record<string, any> = {
                    id: quote_id,
                    lastUpdate: { $gt: last_update_ts }
                };

                expect( given_filter ).to.deep.equal( expected_filter );

                given_callback( null );
            };

            const callback = ( _err: NullableError, _indexAdvanced: boolean ) =>
            {
                callback_called = true;

                return;
            };

            new Sut( collection ).markDocumentAsProcessed(
                quote_id,
                last_update_ts,
                callback,
            );

            expect( callback_called ).to.equal( true );
        });
    });

} );


function _createMockMongoCollection(): MongoCollection
{
    return <MongoCollection> {
        findOne() {},
        update() {},
        findAndModify() {},
        find() {},
        createIndex() {},
        insert() {},
    };
}
