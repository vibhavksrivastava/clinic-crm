export function
prescriptionTemplate(data:any){

return `
<h3>Prescription</h3>

<p>
Patient:
${data.patient}
</p>

<table>
 ...
</table>
`
}