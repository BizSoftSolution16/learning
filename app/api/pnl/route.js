import connectDB from "@/lib/connectDB"

export const GET = async () => {
    try {
        const pool = await connectDB()

        const result = await pool.request()
            .query(`
                -- Optimized PNL Query
-- Key improvements:
-- 1. Created CTEs to avoid repeating the same base query
-- 2. Replaced correlated subqueries with JOINs
-- 3. Removed redundant grouping and aggregations
-- 4. Used proper JOIN syntax instead of comma-separated tables

WITH AccountHierarchy AS (
    -- Build account hierarchy once
    SELECT 
        A.AccountID,
        A.ParentID,
        A.OldAccountCode,
        A.Name,
        A.Open_debit,
        A.Open_Credit,
        A.PNLBSL1ID,
        A.PNLBSL2ID,
        A.PNLBSL3ID,
        T.TypeName,
        G.AccGroupName,
        P1.Name AS PNL_L1,
        P2.Name AS PNL_L2,
        P3.Name AS PNL_L3,
        P3.PNLBSL3ID AS PNL3ID,
        P3.Level AS Seq,
        A1.AccountID AS Account1ID,
        A1.OldAccountCode AS AccountCode1,
        A1.Name AS Level1,
        A2.AccountID AS Account2ID,
        A2.OldAccountCode AS AccountCode2,
        A2.Name AS Level2,
        A3.AccountID AS Account3ID,
        A3.OldAccountCode AS AccountCode3,
        A3.Name AS Level3,
        A4.AccountID AS Account4ID,
        A4.OldAccountCode AS AccountCode4,
        A4.Name AS Level4
    FROM dbo.Accounts A
    INNER JOIN dbo.AccountType T ON T.TypeID = A.TypeID
    INNER JOIN dbo.AccountGroups G ON G.AccGroupID = A.GroupID
    INNER JOIN PNLBalSheetLevel1 P1 ON A.PNLBSL1ID = P1.PNLBSL1ID
    INNER JOIN PNLBalSheetLevel2 P2 ON A.PNLBSL2ID = P2.PNLBSL2ID AND P2.PNLBSL1ID = P1.PNLBSL1ID
    LEFT JOIN PNLBalSheetLevel3 P3 ON A.PNLBSL3ID = P3.PNLBSL3ID AND P3.PNLBSL1ID = P1.PNLBSL1ID AND P3.PNLBSL2ID = P2.PNLBSL2ID
    LEFT JOIN dbo.Accounts A4 ON A.ParentID = A4.AccountID
    LEFT JOIN dbo.Accounts A3 ON A4.ParentID = A3.AccountID
    LEFT JOIN dbo.Accounts A2 ON A3.ParentID = A2.AccountID
    LEFT JOIN dbo.Accounts A1 ON A2.ParentID = A1.AccountID
    WHERE A.LevelNo = 5 
        AND A.IsActive = 1 
        AND A.IsCancel = 0
        AND P1.PNLBSL1ID = 1
),
TransactionData AS (
    -- Aggregate transactions once
    SELECT 
        V.AccountID,
        YEAR(VM.EntryDate) AS SortYear,
        MONTH(VM.EntryDate) AS SortMonth,
        MAX(ISNULL(VM.Fyear, '2022')) AS FYear,
        SUM(V.Debit) AS TotalDebit,
        SUM(V.Credit) AS TotalCredit
    FROM VoucherTransM VM
    INNER JOIN VoucherTransD V ON VM.VoucherID = V.VoucherID
    WHERE V.ISactive = 1
    GROUP BY V.AccountID, YEAR(VM.EntryDate), MONTH(VM.EntryDate)
),
BaseCalculation AS (
    -- Combine hierarchy with transactions
    SELECT 
        AH.Seq,
        AH.Level4,
        AH.Name,
        TD.SortYear,
        TD.SortMonth,
        AH.PNL_L1,
        AH.PNL_L2,
        AH.PNL_L3,
        AH.PNL3ID,
        TD.FYear,
        (AH.Open_Credit + TD.TotalCredit) - (AH.Open_debit + TD.TotalDebit) AS GrossPNL
    FROM AccountHierarchy AH
    INNER JOIN TransactionData TD ON AH.AccountID = TD.AccountID
)
SELECT 
    Seq,
    Level4,
    Name,
    SortYear,
    SortMonth,
    DATENAME(MONTH, DATEADD(MONTH, SortMonth - 1, 0)) AS Month,
    CONCAT(LEFT(DATENAME(MONTH, DATEADD(MONTH, SortMonth - 1, 0)), 3), '-', SortYear) AS Year,
    PNL_L1 AS [PNL&BS_L1],
    PNL_L2 AS [PNL&BS_L2],
    PNL_L3 AS [PNL&BS_L3],
    PNL3ID,
    FYear,
    SUM(GrossPNL) AS GrossTotal
FROM BaseCalculation
GROUP BY Seq, Level4, Name, SortYear, SortMonth, FYear, PNL3ID, PNL_L1, PNL_L2, PNL_L3

UNION ALL

-- Gross Profit / Loss (Seq 1,2)
SELECT 
    3 AS Seq,
    'Gross Profit / (Loss)' AS Level4,
    Name,
    SortYear,
    SortMonth,
    DATENAME(MONTH, DATEADD(MONTH, SortMonth - 1, 0)) AS Month,
    CONCAT(LEFT(DATENAME(MONTH, DATEADD(MONTH, SortMonth - 1, 0)), 3), '-', SortYear) AS Year,
    'Gross Profit / (Loss)' AS [PNL&BS_L1],
    'Gross Profit / (Loss)' AS [PNL&BS_L2],
    'Gross Profit / (Loss)' AS [PNL&BS_L3],
    PNL3ID,
    FYear,
    SUM(GrossPNL) AS GrossTotal
FROM BaseCalculation
WHERE Seq IN (1, 2)
GROUP BY Name, SortYear, SortMonth, FYear, PNL3ID

UNION ALL

-- Total Operating Expenses (Seq 4,5)
SELECT 
    6 AS Seq,
    'Total Operating Expenses' AS Level4,
    Name,
    SortYear,
    SortMonth,
    DATENAME(MONTH, DATEADD(MONTH, SortMonth - 1, 0)) AS Month,
    CONCAT(LEFT(DATENAME(MONTH, DATEADD(MONTH, SortMonth - 1, 0)), 3), '-', SortYear) AS Year,
    'Total Operating Expenses' AS [PNL&BS_L1],
    'Total Operating Expenses' AS [PNL&BS_L2],
    'Total Operating Expenses' AS [PNL&BS_L3],
    PNL3ID,
    FYear,
    SUM(GrossPNL) AS GrossTotal
FROM BaseCalculation
WHERE Seq IN (4, 5)
GROUP BY Name, SortYear, SortMonth, FYear, PNL3ID

UNION ALL

-- Profit / Loss from Operations (Seq 1,2,4,5)
SELECT 
    7 AS Seq,
    'Profit / (Loss) from Operations' AS Level4,
    Name,
    SortYear,
    SortMonth,
    DATENAME(MONTH, DATEADD(MONTH, SortMonth - 1, 0)) AS Month,
    CONCAT(LEFT(DATENAME(MONTH, DATEADD(MONTH, SortMonth - 1, 0)), 3), '-', SortYear) AS Year,
    'Profit / (Loss) from Operations' AS [PNL&BS_L1],
    'Profit / (Loss) from Operations' AS [PNL&BS_L2],
    'Profit / (Loss) from Operations' AS [PNL&BS_L3],
    PNL3ID,
    FYear,
    SUM(GrossPNL) AS GrossTotal
FROM BaseCalculation
WHERE Seq IN (1, 2, 4, 5)
GROUP BY Name, SortYear, SortMonth, FYear, PNL3ID

UNION ALL

-- Profit / Loss Before Taxation (Seq 1,2,4,5,8)
SELECT 
    9 AS Seq,
    'Profit / (Loss) Before Taxation' AS Level4,
    Name,
    SortYear,
    SortMonth,
    DATENAME(MONTH, DATEADD(MONTH, SortMonth - 1, 0)) AS Month,
    CONCAT(LEFT(DATENAME(MONTH, DATEADD(MONTH, SortMonth - 1, 0)), 3), '-', SortYear) AS Year,
    'Profit / (Loss) Before Taxation' AS [PNL&BS_L1],
    'Profit / (Loss) Before Taxation' AS [PNL&BS_L2],
    'Profit / (Loss) Before Taxation' AS [PNL&BS_L3],
    PNL3ID,
    FYear,
    SUM(GrossPNL) AS GrossTotal
FROM BaseCalculation
WHERE Seq IN (1, 2, 4, 5, 8)
GROUP BY Name, SortYear, SortMonth, FYear, PNL3ID

UNION ALL

-- Profit / Loss for the Year (Seq 1,2,4,5,8,10)
SELECT 
    11 AS Seq,
    'Profit / (Loss) for the Year' AS Level4,
    Name,
    SortYear,
    SortMonth,
    DATENAME(MONTH, DATEADD(MONTH, SortMonth - 1, 0)) AS Month,
    CONCAT(LEFT(DATENAME(MONTH, DATEADD(MONTH, SortMonth - 1, 0)), 3), '-', SortYear) AS Year,
    'Profit / (Loss) for the Year' AS [PNL&BS_L1],
    'Profit / (Loss) for the Year' AS [PNL&BS_L2],
    'Profit / (Loss) for the Year' AS [PNL&BS_L3],
    PNL3ID,
    FYear,
    SUM(GrossPNL) AS GrossTotal
FROM BaseCalculation
WHERE Seq IN (1, 2, 4, 5, 8, 10)
GROUP BY Name, SortYear, SortMonth, FYear, PNL3ID

ORDER BY Seq ASC, SortYear ASC, SortMonth ASC, FYear ASC;

                `)

        return Response.json({
            success: true,
            data: result.recordset
        }, { status: 200 })
    }
    catch (error) {
        console.log(error)
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
