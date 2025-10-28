interface ErrorViewProps {
  error: unknown | Error;
}

const ErrorView = ({ error }: ErrorViewProps) => {
  console.warn(error);

  // TODO: can we print out the react context, ie which parent component, and the tree?

  return error instanceof Error ? (
    <div>
      <h3>
        {error.name} {error.message}
      </h3>

      <h4>Stack Trace:</h4>
      <pre>{error.stack}</pre>

      <h4>Cause:</h4>
      {error.cause instanceof Error ? (
        <ErrorView error={error.cause} />
      ) : (
        <pre>{JSON.stringify(error.cause)}</pre>
      )}

      {/* <h4>Component Stacktrace:</h4>
            <pre>{new Error().stack}</pre> */}
    </div>
  ) : (
    <>
      <div>
        <h3>
          An error of unknown type occured, inspect the error value for more
          details, see browser console.
        </h3>

        <pre>{JSON.stringify(error)}</pre>

        {/* <h4>Component Stacktrace:</h4>
            <pre>{new Error().stack}</pre> */}
      </div>
    </>
  );
};

// TODO: Implement a generic <Match /> and <ResultOrDefault /> loader components...
/*
interface AsyncViewProps<T> {
    data: T;
}

function AsyncView<T extends AsyncResult<V, E>, V, E>({ data }: AsyncViewProps<T>) {
    match(data, {
        init: () => (<>init</>),
        loading: () => (<>loading</>),
        value: () => (<>value</>),
        error: (e) => (<ErrorView error={e} />),
    });
};
*/

export { ErrorView };
