// Script only the model's native request. All declarations come from production transport.
export const requestEntries = (...names: string[]) =>
  Response.json({
    id: 'load-entries',
    status: 'completed',
    output: [
      {
        type: 'tool_search_call',
        execution: 'client',
        status: 'completed',
        call_id: 'load-entries-call',
        arguments: { names }
      }
    ]
  })
