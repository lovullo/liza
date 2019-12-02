/**
 * Factory functions for avro
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
import { Duplex } from 'stream';

const avro = require( 'avro-js' );


export interface AvroSchema
{
    /**
     * Write data to a buffer
     *
     * @param data - the data to write
     *
     * @return the buffer if successful
    */
    toBuffer( data: Record<string, any> ): Buffer | null;


    /**
     * Check if data is valid against schema
     *
     * @param data - the data to validate
     * @param opts - options specified as key/values
     *
     * @return the buffer if it is valid
     */
    isValid(
        data: Record<string, any>,
        opts?: Record<string, any>
    ): Buffer | null;


    /**
     * Write to a buffer
     *
     * @param data   - the data to write
     * @param buffer - the buffer that will be written to
     */
    encode( data: Record<string, any>, buffer: Buffer ): void;


    /**
     * Output to a json string
     *
     * @param data - the data to format
     *
     * @return the formatted data
     */
    toString( data: Record<string, any> ): string;


    /**
     * Deserialize from a buffer
     *
     * @param buffer - the buffer to read from
     *
     * @return the resulting data
     */
    fromBuffer( buffer: Buffer ): any;
}


/** The avro encoder constructor type */
export type AvroEncoderCtr = ( type: AvroSchema ) => Duplex;


/** The avro encoder constructor */
export function createAvroEncoder( schema: AvroSchema ): Duplex
{
    return new avro.streams.BlockEncoder( schema );
}