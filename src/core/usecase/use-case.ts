export interface UseCase<I, O> {
  execute(input: I): Promise<O>;
}

export interface UseCaseWithoutInput<O> {
  execute(): Promise<O>;
}

export interface UseCaseWithoutOutput<I> {
  execute(input: I): Promise<void>;
}

export interface UseCaseWithoutInputAndOutput {
  execute(): Promise<void>;
}
