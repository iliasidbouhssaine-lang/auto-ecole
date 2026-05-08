export default function DataTable({ columns, data, emptyMessage = 'Aucune donnée disponible' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map((col, i) => (
              <th
                key={i}
                className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4 first:pl-0 last:pr-0"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-10 text-slate-400 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50/60 transition-colors group">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="py-3 px-4 first:pl-0 last:pr-0 text-slate-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
