/**
 * CmatchVisibility
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
 */
import {Client} from './Client';
import {PositiveInteger} from '../numeric';
import {
  VisibilityMatrix,
  VisibilityScalar,
  VisibilityVector,
} from './quote/ClientQuote';

/**
 * Field name and class visibility name
 *
 * @prop name  - field name
 * @prop cname - class visibility name
 */
interface VisibilityLegend {
  name: string;
  cname: string;
}

/**
 * Field index visibility

 * @prop show - indexes of the field that are visible
 * @prop hide - indexes of the field that are hidden
 */
interface IndexVisibility {
  show: PositiveInteger[];
  hide: PositiveInteger[];
}

/**
 * Simply combine the shapes of VisibilityLegend and IndexVisibility into a new
 * type.
 */
export interface VisibilityBlueprint
  extends VisibilityLegend,
    IndexVisibility {}

/**
 * Expose visibility data from the client
 */
export class CmatchVisibility {
  /**
   * @param _client - active client
   */
  constructor(private readonly _client: Client) {}

  /**
   * Get index visibility for classification names
   *
   * @param list - a list of classification/visibility names
   *
   * @return data containing the classfication name and visibility of indexes
   */
  public getBlueprints(list: VisibilityLegend[]): VisibilityBlueprint[] {
    const classifications = this._client.getQuote().getLastClassify();

    return list.map(legend => {
      const vis_class_data = classifications[legend.cname];

      const output: VisibilityBlueprint = {
        ...legend,
        ...this._getVisibilityShell(),
      };

      // Undefined
      if (!vis_class_data || vis_class_data.indexes === undefined) {
        return output;

        // Scalars
      } else if (typeof vis_class_data.indexes === 'number') {
        const action = vis_class_data.indexes === 1 ? 'show' : 'hide';
        output[action].push(<PositiveInteger>0);

        // Vectors & Matrices
      } else if (Array.isArray(vis_class_data.indexes)) {
        const vis = this._processArray(vis_class_data.indexes);

        vis.show.forEach(index => output.show.push(index));
        vis.hide.forEach(index => output.hide.push(index));
      }

      return output;
    });
  }

  /**
   * Get visibility info for array-based visibility
   *
   * @param indexes - array of visibilty data
   *
   * @return index visibility grouped by show and hide
   */
  private _processArray(
    indexes: VisibilityVector | VisibilityMatrix
  ): IndexVisibility {
    const vis = this._getVisibilityShell();

    indexes.forEach((value: VisibilityScalar | VisibilityVector, i: number) => {
      const show = Array.isArray(value)
        ? value.some(v => +v === 1)
        : +value === 1;

      const action = show ? 'show' : 'hide';
      vis[action].push(<PositiveInteger>+i);
    });

    return vis;
  }

  /**
   * Get an empty shell to store visibility info
   *
   * @return empty shell of visibility info
   */
  private _getVisibilityShell(): IndexVisibility {
    return {
      show: [],
      hide: [],
    };
  }
}
