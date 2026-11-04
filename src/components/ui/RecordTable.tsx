import type { ReactNode } from "react";

/** One table keeps detail state and focus while its rows reflow into mobile cards. */
export default function RecordTable({ caption, columns, rows, empty = "No hay registros en esta página o periodo." }: { caption: string; columns: string[]; rows: { id: string; cells: ReactNode[]; detail?: ReactNode }[]; empty?: string }) {
  if (!rows.length) return <p className="py-4 text-sm text-ui-text-muted">{empty}</p>;
  return <div className="min-w-0 overflow-x-auto"><table role="table" className="ui-table ui-responsive text-sm"><caption>{caption}</caption><thead><tr>{columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}>{row.cells.map((cell, index) => index === 0 ? <th scope="row" key={index}>{cell}{row.detail}</th> : <td data-label={columns[index]} key={index}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
