export function htmlLayout(
  title: string,
  body: string
) {
  return `
<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8" />

<style>

@page {
  size: A4;
  margin: 15mm;
}

body {
  font-family: Arial, sans-serif;
  font-size: 12px;
  color: #111827;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  display: table-header-group;
}

tr {
  page-break-inside: avoid;
}

th,
td {
  border: 1px solid #e5e7eb;
  padding: 8px;
}

.header {
  margin-bottom: 20px;
}

.footer {
  margin-top: 40px;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.summary-table {
  width: 350px;
  margin-left: auto;
}

</style>

</head>

<body>

${body}

</body>

</html>
`
}