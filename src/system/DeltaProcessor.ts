/**
 * Delta Processor
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

import { DeltaDao } from "../system/db/DeltaDao";
import { MongoDeltaType } from "../system/db/MongoDeltaDao";
import { DeltaResult } from "../bucket/delta";
import { DocumentId } from "../document/Document";
import { AmqpPublisher } from "./AmqpPublisher";


/**
 * Process deltas for a quote and publish to a queue
 */
export class DeltaProcessor
{
    /** The ratedata delta type */
    readonly DELTA_RATEDATA: MongoDeltaType = 'ratedata';

    /** The data delta type */
    readonly DELTA_DATA: MongoDeltaType = 'data';


    /**
     * Initialize processor
     *
     * @param _collection Mongo collection
     */
    constructor(
        private readonly _dao:       DeltaDao,
        private readonly _publisher: AmqpPublisher,
    ) {}


    /**
     * Process unpublished deltas
     */
    process(): void
    {
        let self = this;

        this._dao.getUnprocessedDocuments( function( docs )
        {
            docs.forEach( doc => {

                const deltas = self.getTimestampSortedDeltas( doc );

                deltas.forEach( delta => {

                    self._publisher.publish( delta );

                });

                const last_updated_ts    = doc.lastUpdated;
                const doc_id: DocumentId = doc.id;

                self._dao.markDocumentAsProcessed(
                    doc_id,
                    last_updated_ts,
                    function( err, markedSuccessfully )
                    {
                        console.log( err, markedSuccessfully );
                    },
                );
            });
        });
    }


    /**
     * Get sorted list of deltas
     *
     * @param doc - the document
     *
     * @return a list of deltas sorted by timestamp
     */
    getTimestampSortedDeltas(
        doc: any,
    ): DeltaResult<any>[]
    {
        const data_deltas     = this.getDeltas( doc, this.DELTA_RATEDATA );
        const ratedata_deltas = this.getDeltas( doc, this.DELTA_DATA );
        const deltas          = data_deltas.concat( ratedata_deltas );

        deltas.sort( this._sortByTimestamp );

        return deltas;
    }


    /**
     * Get trimmed delta list
     *
     * @param doc  - the document
     * @param type - the delta type to get
     *
     * @return a trimmed list of deltas
     */
    getDeltas(
        doc: any,
        type: MongoDeltaType,
    ): DeltaResult<any>[]
    {
        // Get objects so we can get the index by type
        const deltas_obj = doc.rdelta || {};

        // Get type specific deltas
        let last_published_index = 0;
        if ( doc.lastPublishDelta )
        {
            const last_published_indexes = doc.lastPublishDelta;

            last_published_index = last_published_indexes[ type ] || 0;
        }

        const deltas: DeltaResult<any>[] = deltas_obj[ type ] || [];

        // Only return the unprocessed deltas
        const deltas_trimmed = deltas.slice( last_published_index );

        // Mark each delta with its type
        deltas_trimmed.forEach( delta => {
            delta.type = type;
        });

        return deltas_trimmed;
    }


    /**
     * Sort an array of deltas by timestamp
     *
     * @param a - The first delta to compare
     * @param a - The second delta to compare
     *
     * @return a sort value
     */
    private _sortByTimestamp(
        a: DeltaResult<any>,
        b: DeltaResult<any>,
    ): number
    {
        if ( a.timestamp < b.timestamp )
        {
            return -1;
        }

        if ( a.timestamp > b.timestamp ) {
            return 1;
        }

        return 0;
    }


    /**
     * Generate amqp config from environment variables
     *
     * @returns the amqp configuration
     */
    // generateConfigFromEnv(): AmqpConfig
    // {
    //     return <AmqpConfig>{
    //         "protocol":  "amqp",
    //         "hostname":  process.env.hostname,
    //         "port":      process.env.port,
    //         "username":  process.env.username,
    //         "password":  process.env.password,
    //         "locale":    "en_US",
    //         "frameMax":  0,
    //         "heartbeat": 0,
    //         "vhost":     process.env.vhost,
    //         "exchange":  process.env.exchange,
    //     };
    // }
}