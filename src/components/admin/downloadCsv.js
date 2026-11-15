export function downloadCsv(filename, rows) {
  if (!rows || !rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys, ...rows.map((row) => keys.map((key) => row[key] ?? ''))]
    .map((row) =>
      row
        .map((value) => {
          const safe = /^[=+@\-\t\r]/.test(String(value)) ? `'${value}` : value
          return `"${String(safe).replaceAll('"', '""')}"`
        })
        .join(',')
    )
    .join('\r\n')

  const url = URL.createObjectURL(
    new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  )
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
