/**
 * Delta data access test
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

import { MongoDeltaDao as Sut } from "../../../src/system/db/MongoDeltaDao";
import { MongoCollection } from "mongodb";
import { DeltaDocument } from "../../../src/bucket/delta";
import { DaoError } from '../../../src/error/DaoError';
import { expect, use as chai_use } from 'chai';
import {DocumentId} from "../../../src/document/Document";
chai_use( require( 'chai-as-promised' ) );


describe( 'system.db.MongoDeltaDao', () =>
{
    describe( '#getUnprocessedDocuments', () =>
    {
        it( "finds unprocessed documents that do not have rates pending", () =>
        {
            const stub_env  = 'foo';
            let find_called = false;

            const delta_docs = <DeltaDocument[]>[ {
                id:            <DocumentId>123,
                programId:     '',
                agentName:     '',
                agentEntityId: 0,
                startDate:     <UnixTimestamp>0,
                lastUpdate:    <UnixTimestamp>0,
                data:          {},
                ratedata:      {},
                rdelta:        {},
            } ];

            const coll: MongoCollection = {
                findAndModify() {},
                findOne() {},
                update() {},
                createIndex() {},
                insert() {},
                find(
                    selector,
                    _fields,
                    callback )
                {
                    expect( selector[ 'ratedata.__rate_pending' ] )
                        .to.deep.equal( { $in: [ 0, null ] } );
                    expect( selector.deltaError )
                        .to.deep.equal( { $ne: true } );
                    expect( selector.published )
                        .to.be.false;
                    expect( selector.env )
                        .to.equal( stub_env );

                    find_called = true;
                    callback( null, {
                        toArray: ( c: any ) => c( null, delta_docs ),
                    } );
                },
            };

            const sut = new Sut( coll, stub_env );
            return sut.getUnprocessedDocuments()
                .then( () => expect( find_called ).to.be.true );
        } );

        it( "rejects with error on query failure", () =>
        {
            const stub_env       = 'foo';
            let find_called      = false;
            const expected_error_msg = 'expected error!';

            const coll: MongoCollection = {
                findAndModify() {},
                findOne() {},
                update() {},
                createIndex() {},
                insert() {},
                find(
                    _selector,
                    _fields,
                    callback )
                {
                    find_called = true;
                    callback( new Error( expected_error_msg ), {} );
                },
            };

            const sut = new Sut( coll, stub_env );
            return expect( sut.getUnprocessedDocuments() )
                .to.eventually.rejectedWith( DaoError, expected_error_msg )
                .then( () => expect( find_called ).to.be.true );
        } );
    } );
} );
