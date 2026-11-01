interface ContractDocumentProps {
  title: string
  data: Record<string, unknown>
}

export function ContractDocument({ title, data }: ContractDocumentProps) {
  return (
    <article className="contract-document" aria-label="Contract document">
      <h1>{title}</h1>
      <p>
        Declared contract fields. This document does not claim runtime status or
        execution results.
      </p>
      {Object.entries(data).map(([name, value]) => (
        <section key={name}>
          <h2>{name}</h2>
          <pre>{JSON.stringify(value, null, 2)}</pre>
        </section>
      ))}
    </article>
  )
}
