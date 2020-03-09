/**
 * Client-side quote
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
import { StagingBucket } from "../../bucket/StagingBucket";

export type Data = Record<string, any>;

/**
 * Controller for the program client
 */
export declare class ClientQuote
{

    /**
     * Set the classifier to be used for data classification
     *
     * The classifier should return an object containing all classifications and
     * a single boolean value per classification.
     */
    setClassifier( known_fields: any, classifier: any ): ClientQuote;


    /**
     * Hook events
     */
    on( event_id: string, callback: ( classes: any ) => void ): void;


    /**
     * Returns data from the quote
     */
    getDataByName( name: string ): Record<string, any>


    /**
     * Visits staging data
     */
    visitData( visitor: ( bucket: StagingBucket) => void ): void;


    /**
     * Stages the given data
     *
     * Data is not written directly to the quote. It must be committed.
     */
    setData( data: Data ): ClientQuote;
}