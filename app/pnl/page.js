'use client'
import { useState, useEffect } from "react"

export default function PNLSheet() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [months, setMonths] = useState([])
    const [rows, setRows] = useState([])

    useEffect(() => {
        fetchPNL()
    }, [])

    const fetchPNL = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/pnl')
            const result = await res.json()
            if (result.success) {
                processData(result.data)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const processData = (rawData) => {
        // Create month-year keys and sort chronologically
        const monthYearMap = {}
        rawData.forEach(item => {
            const key = `${item.SortYear}-${String(item.SortMonth).padStart(2, '0')}`
            monthYearMap[key] = item.Year
        })

        const sortedMonths = Object.keys(monthYearMap).sort().map(key => monthYearMap[key])
        const uniqueMonths = [...new Set(sortedMonths)]
        setMonths(uniqueMonths)

        // Group by account/category and sum same months
        const grouped = {}
        rawData.forEach(item => {
            const key = `${item.Seq}_${item.Level4}`
            if (!grouped[key]) {
                grouped[key] = {
                    seq: item.Seq,
                    name: item.Level4,
                    category: item['PNL&BS_L1'],
                    values: {}
                }
            }
            // Sum values for same month
            if (!grouped[key].values[item.Year]) {
                grouped[key].values[item.Year] = 0
            }
            grouped[key].values[item.Year] += item.GrossTotal
        })

        // Convert to array and sort by seq
        const rowsArray = Object.values(grouped).sort((a, b) => a.seq - b.seq)
        setRows(rowsArray)
        setData(rawData)
    }

    const formatCurrency = (value) => {
        if (!value) return '-'
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.abs(value))
    }

    const getRowStyle = (seq, name) => {
        const summaryRows = [
            'Gross Profit / (Loss)',
            'Total Operating Expenses',
            'Profit / (Loss) from Operations',
            'Profit / (Loss) Before Taxation',
            'Profit / (Loss) for the Year'
        ]

        if (summaryRows.includes(name)) {
            return {
                backgroundColor: '#fff9e6',
                fontWeight: 'bold',
                borderTop: '2px solid #000',
                borderBottom: '1px solid #000'
            }
        }
        return {}
    }

    const getCellStyle = (value) => {
        if (!value || value === 0) return { textAlign: 'right' }
        return {
            textAlign: 'right',
            color: value < 0 ? '#d00' : '#000'
        }
    }

    const calculateTotal = (row) => {
        return Object.values(row.values).reduce((sum, val) => sum + (val || 0), 0)
    }

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', overflowX: 'auto' }}>
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>PROFIT AND LOSS ACCOUNT</h1>
                <p style={{ margin: '5px 0', color: '#666' }}>
                    For the Period from '2022-07-01' To '2023-06-30'
                </p>
            </div>

            {rows.length === 0 ? (
                <p>No data available</p>
            ) : (
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1px solid #000',
                    fontSize: '12px'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#e8e8e8' }}>
                            <th style={{
                                padding: '8px',
                                textAlign: 'left',
                                border: '1px solid #000',
                                minWidth: '200px',
                                position: 'sticky',
                                left: 0,
                                backgroundColor: '#e8e8e8',
                                zIndex: 10
                            }}></th>
                            {months.map(month => (
                                <th key={month} style={{
                                    padding: '8px',
                                    textAlign: 'right',
                                    border: '1px solid #000',
                                    minWidth: '100px'
                                }}>
                                    {month}
                                </th>
                            ))}
                            <th style={{
                                padding: '8px',
                                textAlign: 'right',
                                border: '1px solid #000',
                                backgroundColor: '#d9d9d9',
                                fontWeight: 'bold',
                                minWidth: '120px'
                            }}>
                                Grand Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => (
                            <tr key={idx} style={getRowStyle(row.seq, row.name)}>
                                <td style={{
                                    padding: '8px',
                                    border: '1px solid #000',
                                    position: 'sticky',
                                    left: 0,
                                    backgroundColor: getRowStyle(row.seq, row.name).backgroundColor || '#fff',
                                    zIndex: 5
                                }}>
                                    {row.name}
                                </td>
                                {months.map(month => (
                                    <td key={month} style={{
                                        ...getCellStyle(row.values[month]),
                                        padding: '8px',
                                        border: '1px solid #000'
                                    }}>
                                        {formatCurrency(row.values[month])}
                                    </td>
                                ))}
                                <td style={{
                                    ...getCellStyle(calculateTotal(row)),
                                    padding: '8px',
                                    border: '1px solid #000',
                                    backgroundColor: '#f5f5f5',
                                    fontWeight: 'bold'
                                }}>
                                    {formatCurrency(calculateTotal(row))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}
