import pf.Server

Routes :: {}.
{
    ## Split a raw path into non-empty segments.
    segments : Str -> List(Str)
    segments = |raw_path|
        raw_path
            |> Str.split_on("/")
            |> List.drop_if(|s| Str.is_empty(s))
}
