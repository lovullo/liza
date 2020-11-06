import {ProgramInit} from '../../program/ProgramInit';
import {Program} from '../../program/Program';
import {QuoteDataBucket} from '../../bucket/QuoteDataBucket';
import {StagingBucket} from '../../bucket/StagingBucket';

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
    private readonly bucketMaker: () => QuoteDataBucket,
    private readonly programInitMaker: () => ProgramInit
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
    const bucket = <StagingBucket>this.bucketMaker().setValues(bucket_data);

    program.initQuote(bucket, false);

    this.programInitMaker().init(program, bucket);

    return {bucket, program};
  }
}
