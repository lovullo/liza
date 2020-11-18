import {Program} from '../../program/Program';
import {QuoteDataBucket} from '../../bucket/QuoteDataBucket';
import {StagingBucket} from '../../bucket/StagingBucket';
import {applyBucketDefaults} from '../../../src/server/quote/loader';

/**
 * Data retriever is partial bucket implementation
 *
 * A dummy quote "API" needs to be able to return a bucket that can retrieve its
 * data for rating.
 */
export interface DataRetriever {
  getData(): CommonObject;
}

/**
 * Generates a new program on demand
 */
export class ProgramFactory {
  /**
   * Create a new ProgramFactory
   *
   * @param programMaker     - creates a program
   * @param bucketMaker      - creates a bucket
   * @param programInitMaker - inits a program

   */
  constructor(
    private readonly programMaker: () => Program,
    private readonly bucketMaker: () => QuoteDataBucket
  ) {}

  /**
   * Create a new program
   *
   * @return a new program
   */
  public createProgram(
    bucket_data: CommonObject = {}
  ): {bucket: DataRetriever; program: Program} {
    const program = this.programMaker();
    const bucket = <StagingBucket>(
      this.bucketMaker().setValues(applyBucketDefaults(program)(bucket_data)())
    );

    program.initQuote(bucket, false);

    return {bucket, program};
  }
}
